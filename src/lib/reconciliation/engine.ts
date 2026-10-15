import Decimal from 'decimal.js';
import { money } from '../decimal';
import { Invoice, Transaction, TransactionMatch } from '../../types';

export interface MatchCandidate {
  invoice: Invoice;
  transaction: Transaction;
  suggestedMatchAmount: string;
  confidenceScore: number;
  matchReasons: string[];
  matchType: 'exact_amount' | 'reference_found' | 'party_name_match' | 'fuzzy_date' | 'partial_payment';
}

/**
 * Finds reconciliation match candidates between open invoices and unmatched bank/UPI transactions
 */
export function findMatchSuggestions(
  invoices: Invoice[],
  transactions: Transaction[]
): MatchCandidate[] {
  const suggestions: MatchCandidate[] = [];

  // Filter for candidate invoices with outstanding balances
  const openInvoices = invoices.filter((inv) => {
    const bal = inv.outstanding_balance || inv.amount_due || '0.00';
    return money(bal).gt(0) || inv.payment_status !== 'paid';
  });

  // Filter for unmatched or partially matched transactions
  const candidateTxns = transactions.filter((txn) => {
    const unmatched = txn.unmatched_amount || txn.amount || '0.00';
    return money(unmatched).gt(0) || txn.reconciliation_status !== 'matched';
  });

  for (const txn of candidateTxns) {
    const txnAmt = money(txn.amount);
    const txnDesc = (txn.description || '').toLowerCase();
    const txnDate = new Date(txn.transaction_date).getTime();

    // Outgoing payments (debits) match purchase invoices; Incoming receipts (credits) match sales invoices
    const isDebit = txn.direction === 'debit' || txn.transaction_type === 'debit';
    const targetDirection = isDebit ? 'purchase' : 'sales';

    for (const inv of openInvoices) {
      const invDirection = inv.direction || (inv.invoice_type === 'purchase_tax_invoice' ? 'purchase' : 'sales');
      if (invDirection !== targetDirection) continue;

      const invOutstanding = money(inv.outstanding_balance || inv.amount_due || '0.00');
      const invDate = new Date(inv.invoice_date).getTime();
      const dateDiffDays = Math.abs(txnDate - invDate) / (1000 * 60 * 60 * 24);

      const matchReasons: string[] = [];
      let score = 0;

      // 1. Exact amount match
      const isExactAmount = txnAmt.equals(invOutstanding) || txnAmt.equals(money(inv.total_amount));
      if (isExactAmount) {
        score += 50;
        matchReasons.push(`Exact amount match (₹${txn.amount})`);
      } else if (txnAmt.lt(invOutstanding)) {
        // Potential partial payment
        score += 20;
        matchReasons.push(`Potential partial payment (₹${txn.amount} of ₹${invOutstanding})`);
      }

      // 2. Reference / Invoice Number match in bank description
      const cleanInvNum = inv.invoice_number.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      const cleanDesc = txnDesc.replace(/[^a-zA-Z0-9]/g, '');
      if (cleanInvNum && cleanDesc.includes(cleanInvNum)) {
        score += 40;
        matchReasons.push(`Invoice number "${inv.invoice_number}" present in transaction narration`);
      }

      // 3. Counterparty trade or legal name match
      const partyName = (invDirection === 'purchase'
        ? inv.supplier_legal_name || inv.supplier_name
        : inv.customer_legal_name || inv.buyer_name) || '';
      const tradeName = (invDirection === 'purchase'
        ? inv.supplier_trade_name || inv.supplier_name
        : inv.customer_trade_name || inv.buyer_name) || '';
      
      const pFirstWord = partyName.split(' ')[0]?.toLowerCase();
      const tFirstWord = tradeName.split(' ')[0]?.toLowerCase();

      if (pFirstWord && pFirstWord.length > 3 && txnDesc.includes(pFirstWord)) {
        score += 25;
        matchReasons.push(`Vendor/Client name "${pFirstWord}" recognized in bank record`);
      } else if (tFirstWord && tFirstWord.length > 3 && txnDesc.includes(tFirstWord)) {
        score += 25;
        matchReasons.push(`Trade name "${tFirstWord}" recognized in bank record`);
      }

      // 4. Temporal proximity (invoices usually paid within 0 - 30 days)
      if (dateDiffDays <= 3) {
        score += 15;
        matchReasons.push(`Transaction occurred within 3 days of invoice date`);
      } else if (dateDiffDays <= 15) {
        score += 10;
        matchReasons.push(`Transaction occurred within 15 days of invoice date`);
      } else if (dateDiffDays <= 35) {
        score += 5;
      }

      // Determine match type and normalize confidence score (0 to 1)
      if (score >= 40) {
        const normalizedConfidence = Math.min(0.99, score / 100);
        let matchType: MatchCandidate['matchType'] = 'exact_amount';
        if (cleanInvNum && cleanDesc.includes(cleanInvNum)) {
          matchType = 'reference_found';
        } else if (isExactAmount) {
          matchType = 'exact_amount';
        } else if (txnAmt.lt(invOutstanding)) {
          matchType = 'partial_payment';
        } else {
          matchType = 'party_name_match';
        }

        const matchAmount = Decimal.min(txnAmt, invOutstanding).toFixed(2);

        suggestions.push({
          invoice: inv,
          transaction: txn,
          suggestedMatchAmount: matchAmount,
          confidenceScore: normalizedConfidence,
          matchReasons,
          matchType,
        });
      }
    }
  }

  // Sort by highest confidence first
  return suggestions.sort((a, b) => b.confidenceScore - a.confidenceScore);
}

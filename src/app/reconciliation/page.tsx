'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_INVOICES, DEMO_TRANSACTIONS } from '@/lib/demo-data';
import { findMatchSuggestions, MatchCandidate } from '@/lib/reconciliation/engine';
import { formatINR } from '@/lib/decimal';
import {
  Link2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Check,
  X,
  AlertCircle,
  HelpCircle,
  FileText,
  CreditCard,
  Layers,
  History
} from 'lucide-react';

export default function ReconciliationPage() {
  const [invoices, setInvoices] = useState(DEMO_INVOICES);
  const [transactions, setTransactions] = useState(DEMO_TRANSACTIONS);
  const [confirmedMatches, setConfirmedMatches] = useState<string[]>(['match-pre-1', 'match-pre-2']);
  const [dismissedMatches, setDismissedMatches] = useState<string[]>([]);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const fetchReconData = async () => {
    try {
      const [invRes, txnRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/transactions'),
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData.invoices) && invData.invoices.length > 0) {
          setInvoices(invData.invoices);
        }
      }

      if (txnRes.ok) {
        const txnData = await txnRes.json();
        if (Array.isArray(txnData.transactions) && txnData.transactions.length > 0) {
          setTransactions(txnData.transactions);
        }
      }
    } catch (e) {
      console.warn('Could not load remote reconciliation data:', e);
    }
  };

  React.useEffect(() => {
    fetchReconData();
  }, []);

  // Find automated match suggestions using our reconciliation engine
  const matchCandidates = findMatchSuggestions(invoices, transactions).filter(
    (c) =>
      !confirmedMatches.includes(`${c.invoice.id}-${c.transaction.id}`) &&
      !dismissedMatches.includes(`${c.invoice.id}-${c.transaction.id}`)
  );

  const handleApproveMatch = async (candidate: MatchCandidate) => {
    const matchKey = `${candidate.invoice.id}-${candidate.transaction.id}`;
    setIsSubmittingMatch(matchKey);
    setApiError(null);

    try {
      // Call server API for atomic update & audit logging
      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: candidate.transaction.id,
          invoice_id: candidate.invoice.id,
          allocated_amount: candidate.suggestedMatchAmount,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        console.warn('Remote reconciliation match notice (using local state fallback):', errData);
      }

      setConfirmedMatches([...confirmedMatches, matchKey]);

      // Update invoice payment status
      setInvoices(
        invoices.map((inv) =>
          inv.id === candidate.invoice.id
            ? {
                ...inv,
                amount_paid: candidate.suggestedMatchAmount,
                amount_due: '0.00',
                payment_status: 'paid',
              }
            : inv
        )
      );

      // Update transaction to matched
      setTransactions(
        transactions.map((txn) =>
          txn.id === candidate.transaction.id
            ? {
                ...txn,
                reconciliation_status: 'matched',
                matched_amount: candidate.suggestedMatchAmount,
                unmatched_amount: '0.00',
              }
            : txn
        )
      );
    } catch (err: any) {
      setApiError(err?.message || 'Failed to approve match');
    } finally {
      setIsSubmittingMatch(null);
    }
  };

  const handleDismissMatch = (candidate: MatchCandidate) => {
    const matchKey = `${candidate.invoice.id}-${candidate.transaction.id}`;
    setDismissedMatches([...dismissedMatches, matchKey]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Bank & UPI Reconciliation Engine
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Match incoming UPI payments and outgoing vendor NEFTs to tax invoices with explainable heuristics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success">2 Auto-Reconciled</Badge>
            <Badge variant={matchCandidates.length > 0 ? 'accent' : 'outline'}>
              {matchCandidates.length} Suggestions Pending
            </Badge>
          </div>
        </div>

        {/* AI Heuristics Suggestion Cards */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary-600" />
              Automated Match Suggestions
            </h2>
            <span className="text-xs text-text-tertiary">
              Deterministic scoring based on UTR narration, exact amounts & counterparty analysis
            </span>
          </div>

          {matchCandidates.length > 0 ? (
            <div className="space-y-4">
              {matchCandidates.map((candidate, idx) => {
                const isHighConfidence = candidate.confidenceScore >= 0.85;
                return (
                  <Card
                    key={idx}
                    className="border-primary-200 dark:border-primary-800/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="bg-primary-50/50 dark:bg-primary-950/30 px-5 py-2.5 border-b border-primary-100 dark:border-primary-900 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant={isHighConfidence ? 'success' : 'accent'}>
                          {Math.round(candidate.confidenceScore * 100)}% Match Confidence
                        </Badge>
                        <span className="font-semibold text-text-primary">
                          Type: {candidate.matchType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-text-secondary">
                        Suggested Settlement: <strong className="text-primary-700 dark:text-primary-300">{formatINR(candidate.suggestedMatchAmount)}</strong>
                      </span>
                    </div>

                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                        {/* Left: Invoice Side (5 cols) */}
                        <div className="md:col-span-5 p-3.5 rounded-xl bg-surface-secondary border border-border">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase mb-2">
                            <FileText className="h-3.5 w-3.5 text-primary-600" />
                            Target Invoice
                          </div>
                          <div className="font-bold text-text-primary text-sm font-mono">
                            {candidate.invoice.invoice_number}
                          </div>
                          <div className="font-semibold text-xs text-text-primary mt-0.5">
                            {candidate.invoice.invoice_type === 'purchase_tax_invoice'
                              ? candidate.invoice.supplier_legal_name
                              : candidate.invoice.customer_legal_name}
                          </div>
                          <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-border/50">
                            <span className="text-text-secondary">Outstanding:</span>
                            <span className="font-bold text-primary-600">
                              {formatINR(candidate.invoice.outstanding_balance || candidate.invoice.amount_due || '0.00')}
                            </span>
                          </div>
                        </div>

                        {/* Center Link Icon (1 col) */}
                        <div className="hidden md:flex md:col-span-1 justify-center items-center text-primary-600">
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                            <Link2 className="h-4 w-4" />
                          </div>
                        </div>

                        {/* Right: Bank Record Side (5 cols) */}
                        <div className="md:col-span-5 p-3.5 rounded-xl bg-surface-secondary border border-border">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase mb-2">
                            <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                            Bank / UPI Record
                          </div>
                          <div className="font-mono text-xs text-text-secondary">
                            {candidate.transaction.transaction_date} • {candidate.transaction.bank_account_name}
                          </div>
                          <div className="font-semibold text-xs text-text-primary mt-0.5 line-clamp-1">
                            {candidate.transaction.description}
                          </div>
                          <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-border/50">
                            <span className="text-text-secondary">Txn Amount:</span>
                            <span className="font-bold text-text-primary">
                              {formatINR(candidate.transaction.amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reasons Chip Bar */}
                      <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-text-tertiary">Match evidence:</span>
                          {candidate.matchReasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] text-text-secondary"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissMatch(candidate)}
                            className="text-xs text-text-tertiary hover:text-red-600"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleApproveMatch(candidate)}
                            className="text-xs"
                          >
                            <Check className="h-3.5 w-3.5 mr-1 text-white" /> Approve & Link Match
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-text-primary">
                All Eligible Records Reconciled
              </h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                No unmatched suggestions pending. Import additional bank statements or upload vendor invoices to discover new matches.
              </p>
            </Card>
          )}
        </div>

        {/* Existing Confirmed Matches Log */}
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <History className="h-4 w-4 text-text-secondary" />
            Audit Log of Reconciled Settlements (October 2026)
          </h3>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Vendor / Client</th>
                      <th className="px-4 py-2.5">Bank Reference / UPI</th>
                      <th className="px-4 py-2.5 text-right">Settled Amount</th>
                      <th className="px-4 py-2.5 text-right">Audit Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr className="hover:bg-surface-tertiary/50">
                      <td className="px-4 py-3 font-mono font-bold text-text-primary">
                        APX/2026/881
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        Apex FMCG Distributors LLP
                      </td>
                      <td className="px-4 py-3 font-mono text-text-secondary">
                        UPI/327718928312
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        ₹53,100.00
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="success">Confirmed & Logged</Badge>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-tertiary/50">
                      <td className="px-4 py-3 font-mono font-bold text-text-primary">
                        HUL/MUM/77321
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        Hindustan Consumer Products Agency
                      </td>
                      <td className="px-4 py-3 font-mono text-text-secondary">
                        NEFT/20261006/9931
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        ₹45,076.00
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="success">Confirmed & Logged</Badge>
                      </td>
                    </tr>
                    <tr className="hover:bg-surface-tertiary/50">
                      <td className="px-4 py-3 font-mono font-bold text-text-primary">
                        SKT/OUT/2026/104
                      </td>
                      <td className="px-4 py-3 text-text-primary">
                        Pooja Caterers & Event Organizers
                      </td>
                      <td className="px-4 py-3 font-mono text-text-secondary">
                        UPI/328400192301
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-emerald-600">
                        ₹61,360.00
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Badge variant="success">Confirmed & Logged</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

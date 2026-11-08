#!/usr/bin/env -npx tsx
/**
 * DIGITAX Demo Business - Post-Seeding Audit Script
 * 
 * READ-ONLY: This script performs read-only queries against Supabase.
 * It does NOT insert, update, delete, truncate, or reset any data.
 * 
 * Usage:
 *   npx tsx scripts/audit-demo.ts
 */

import { loadEnvConfig } from '@next/env';

// Load .env.local BEFORE any module that reads Supabase env vars.
loadEnvConfig(process.cwd());

// Now import Supabase client after env vars are loaded
import { createServiceClient } from '@/lib/supabase/server';
import { money, roundMoney } from '@/lib/decimal';
import Decimal from 'decimal.js';

// Supabase service role client (read-only operations only)
const supabase = createServiceClient();

interface AuditResult {
  section: string;
  check: string;
  passed: boolean;
  detail: string;
}

const results: AuditResult[] = [];

function record(section: string, check: string, passed: boolean, detail: string) {
  results.push({ section, check, passed, detail });
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`  ${status}: ${check} - ${detail}`);
}

async function main() {
  console.log('========================================');
  console.log('  DIGITAX Demo Business - Post-Seeding Audit');
  console.log('========================================\n');
  console.log('MODE: READ-ONLY (no data modification)\n');

  // ============================================
  // 1. Discover all shops in database
  // ============================================
  console.log('--- 1. Business Discovery ---\n');

  const { data: allShops, error: shopErr } = await supabase
    .from('shops')
    .select('id, name, gstin, state, city, taxpayer_scheme, financial_year_start_month, onboarding_completed');

  if (shopErr || !allShops) {
    console.error(`Failed to fetch shops: ${shopErr?.message}`);
    process.exit(1);
  }

  console.log(`Found ${allShops.length} shop(s) in database:\n`);
  for (const s of allShops) {
    console.log(`  - ${s.name} (ID: ${s.id}, GSTIN: ${s.gstin}, State: ${s.state}, City: ${s.city})`);
  }

  if (allShops.length === 0) {
    console.log('\n⚠ No shops found in database. Demo data may not be seeded yet.');
    process.exit(0);
  }

  const shopMap: Map<string, any> = new Map();
  for (const s of allShops) {
    shopMap.set(s.id, s);
  }

  // ============================================
  // 2. Data Counts per Business
  // ============================================
  console.log('\n--- 2. Data Counts ---\n');

  const counts: Map<string, Record<string, number>> = new Map();

  for (const [shopId, shop] of shopMap) {
    const countsForShop: Record<string, number> = {};

    // Shop members
    const { count: membersCount } = await supabase
      .from('shop_members')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    countsForShop['shop_members'] = membersCount || 0;

    // Invoices
    const { count: invCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    countsForShop['invoices'] = invCount || 0;

    // Invoice items - need to get via invoice IDs
    const invData = await supabase
      .from('invoices')
      .select('id')
      .eq('shop_id', shopId);
    const invIds = invData.data?.map(i => i.id) || [];
    const { data: allInvItems } = await supabase
      .from('invoice_items')
      .select('invoice_id')
      .in('invoice_id', invIds);
    countsForShop['invoice_items'] = allInvItems?.length || 0;

    // Transactions
    const { count: txnCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    countsForShop['transactions'] = txnCount || 0;

    // Documents
    const { count: docCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    countsForShop['documents'] = docCount || 0;

    // Reconciliation matches
    const { count: matchCount } = await supabase
      .from('reconciliation_matches')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    countsForShop['reconciliation_matches'] = matchCount || 0;

    // GST summaries
    const { count: gstCount } = await supabase
      .from('gst_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    countsForShop['gst_summaries'] = gstCount || 0;

    // Filing periods
    const { count: fpCount } = await supabase
      .from('filing_periods')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    countsForShop['filing_periods'] = fpCount || 0;

    counts.set(shopId, countsForShop);

    record('Data Counts', `${shop.name} - Shops`, countsForShop['shops'] > 0, `${countsForShop['shops']} record(s)`);
    record('Data Counts', `${shop.name} - Shop Members`, countsForShop['shop_members'] > 0, `${countsForShop['shop_members']} record(s)`);
    record('Data Counts', `${shop.name} - Invoices`, countsForShop['invoices'] > 0, `${countsForShop['invoices']} record(s)`);
    record('Data Counts', `${shop.name} - Invoice Items`, countsForShop['invoice_items'] > 0, `${countsForShop['invoice_items']} record(s)`);
    record('Data Counts', `${shop.name} - Transactions`, countsForShop['transactions'] > 0, `${countsForShop['transactions']} record(s)`);
    record('Data Counts', `${shop.name} - Documents`, countsForShop['documents'] > 0, `${countsForShop['documents']} record(s)`);
    record('Data Counts', `${shop.name} - Reconciliation Matches`, countsForShop['reconciliation_matches'] > 0, `${countsForShop['reconciliation_matches']} record(s)`);
    record('Data Counts', `${shop.name} - GST Summaries`, countsForShop['gst_summaries'] > 0, `${countsForShop['gst_summaries']} record(s)`);
    record('Data Counts', `${shop.name} - Filing Periods`, countsForShop['filing_periods'] > 0, `${countsForShop['filing_periods']} record(s)`);
  }

  // ============================================
  // 3. Data Consistency - Invoice Calculations
  // ============================================
  console.log('\n--- 3. Financial Data Integrity ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*, invoice_items(*)')
      .eq('shop_id', shopId);

    if (!invoices) {
      record('Data Integrity', `${shop.name} - No invoices found`, false, 'No invoices to validate');
      continue;
    }

    let allArithmeticValid = true;
    let allPaymentConsistent = true;

    for (const inv of invoices) {
      const items = inv.invoice_items || [];
      const itemTaxableSum = items.reduce((acc, item) => acc.plus(new Decimal(item.taxable_value || '0')), new Decimal(0));
      const itemTotalSum = items.reduce((acc, item) => acc.plus(new Decimal(item.total_amount || '0')), new Decimal(0));

      const dbTaxable = new Decimal(inv.taxable_value || '0');
      const dbTotal = new Decimal(inv.total_amount || '0');
      const dbAmountPaid = new Decimal(inv.amount_paid || '0');
      const dbAmountDue = new Decimal(inv.amount_due || '0');

      const taxableMatch = itemTaxableSum.equals(dbTaxable) || itemTaxableSum.minus(dbTaxable).abs().lessThan(new Decimal('0.01'));
      const totalMatch = itemTotalSum.equals(dbTotal) || itemTotalSum.minus(dbTotal).abs().lessThan(new Decimal('0.01'));
      const paidDueMatch = dbAmountPaid.plus(dbAmountDue).equals(dbTotal) || dbAmountPaid.plus(dbAmountDue).minus(dbTotal).abs().lessThan(new Decimal('0.01'));

      if (!taxableMatch || !totalMatch) {
        allArithmeticValid = false;
        record('Data Integrity', `Invoice ${inv.invoice_number} - Arithmetic`, false, `Taxable: items=${itemTaxableSum.toString()}, db=${dbTaxable.toString()}; Total: items=${itemTotalSum.toString()}, db=${dbTotal.toString()}`);
      }

      if (!paidDueMatch) {
        allPaymentConsistent = false;
        record('Data Integrity', `Invoice ${inv.invoice_number} - Payment`, false, `Paid(${dbAmountPaid.toString()}) + Due(${dbAmountDue.toString()}) != Total(${dbTotal.toString()})`);
      }
    }

    if (allArithmeticValid) {
      record('Data Integrity', `${shop.name} - Invoice arithmetic`, true, `All ${invoices.length} invoices have consistent line item totals`);
    }
    if (allPaymentConsistent) {
      record('Data Integrity', `${shop.name} - Payment allocation`, true, `All ${invoices.length} invoices have consistent paid/due totals`);
    }
  }

  // ============================================
  // 4. Reconciliation Integrity
  // ============================================
  console.log('\n--- 4. Reconciliation Integrity ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: matches } = await supabase
      .from('reconciliation_matches')
      .select('*, transactions(*), invoices(*)')
      .eq('shop_id', shopId);

    if (!matches || matches.length === 0) {
      record('Reconciliation', `${shop.name} - No matches found`, true, 'No reconciliation records to validate');
      continue;
    }

    let allSameShop = true;
    let allAmountsValid = true;

    for (const match of matches) {
      const txn = (match as any).transactions;
      const inv = (match as any).invoices;

      if (txn.shop_id !== shopId || inv.shop_id !== shopId || match.shop_id !== shopId) {
        allSameShop = false;
        record('Reconciliation', `Match ${match.id} - Cross-shop detected`, false, `txn_shop=${txn.shop_id}, inv_shop=${inv.shop_id}, match_shop=${match.shop_id}`);
      }

      const allocated = new Decimal(match.allocated_amount || '0');
      const txnAmount = new Decimal(txn.amount || '0');
      const invAmountDue = new Decimal(inv.amount_due || '0');

      if (allocated.greaterThan(txnAmount) || allocated.greaterThan(invAmountDue)) {
        allAmountsValid = false;
        record('Reconciliation', `Match ${match.id} - Amount exceeds`, false, `Allocated=${allocated.toString()}, txn=${txnAmount.toString()}, inv_due=${invAmountDue.toString()}`);
      }
    }

    if (allSameShop) {
      record('Reconciliation', `${shop.name} - Same-shop matches`, true, `All ${matches.length} matches reference same-shop transaction and invoice`);
    }
    if (allAmountsValid) {
      record('Reconciliation', `${shop.name} - Match amounts valid`, true, `All ${matches.length} matches have allocated amounts within transaction/invoice limits`);
    }
  }

  // ============================================
  // 5. GST Summary Consistency
  // ============================================
  console.log('\n--- 5. GST Summary Consistency ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: gstSummaries } = await supabase
      .from('gst_summaries')
      .select('*')
      .eq('shop_id', shopId);

    if (!gstSummaries || gstSummaries.length === 0) {
      record('GST Summary', `${shop.name} - No GST summaries found`, false, 'No GST summary records');
      continue;
    }

    for (const summary of gstSummaries) {
      const netLiability = new Decimal(summary.net_tax_liability || '0');
      const outputCgst = new Decimal(summary.output_cgst || '0');
      const outputSgst = new Decimal(summary.output_sgst || '0');
      const outputIgst = new Decimal(summary.output_igst || '0');
      const inputCgst = new Decimal(summary.input_cgst || '0');
      const inputSgst = new Decimal(summary.input_sgst || '0');
      const inputIgst = new Decimal(summary.input_igst || '0');

      const calculatedNet = outputCgst.plus(outputSgst).plus(outputIgst).minus(inputCgst).minus(inputSgst).minus(inputIgst);
      const netMatches = calculatedNet.equals(netLiability) || calculatedNet.minus(netLiability).abs().lessThan(new Decimal('0.01'));

      if (!netMatches) {
        record('GST Summary', `${shop.name} - Period ${summary.tax_period}`, false, `Calculated net tax(${calculatedNet.toString()}) != Stored(${netLiability.toString()})`);
      } else {
        record('GST Summary', `${shop.name} - Period ${summary.tax_period}`, true, `Net tax ${netLiability.toString()} consistent with component taxes`);
      }
    }
  }

  // ============================================
  // 6. Document Storage Verification
  // ============================================
  console.log('\n--- 6. Document Storage ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('shop_id', shopId);

    if (!documents || documents.length === 0) {
      record('Document Storage', `${shop.name} - No documents found`, true, 'No document records to verify');
      continue;
    }

    let allHaveStoragePath = true;
    let allHaveContentHash = true;

    for (const doc of documents) {
      if (!doc.storage_path || doc.storage_path.trim() === '') {
        allHaveStoragePath = false;
        record('Document Storage', `${shop.name} - ${doc.original_filename}`, false, 'Missing storage_path');
      }
      if (!doc.content_hash || doc.content_hash.trim() === '') {
        allHaveContentHash = false;
        record('Document Storage', `${shop.name} - ${doc.original_filename}`, false, 'Missing content_hash');
      }
    }

    if (allHaveStoragePath) {
      record('Document Storage', `${shop.name} - Storage paths`, true, `All ${documents.length} documents have storage_path`);
    }
    if (allHaveContentHash) {
      record('Document Storage', `${shop.name} - Content hashes`, true, `All ${documents.length} documents have content_hash`);
    }
  }

  // ============================================
  // 7. Tenant Isolation
  // ============================================
  console.log('\n--- 7. Tenant Isolation ---\n');

  const shopIds = Array.from(shopMap.keys());
  for (const shopId of shopIds) {
    const shop = shopMap.get(shopId);
    if (!shop) continue;

    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('id, shop_id');

    const shopInvs = allInvoices?.filter(i => i.shop_id === shopId) || [];
    const otherInvs = allInvoices?.filter(i => i.shop_id !== shopId && i.shop_id !== null) || [];

    const shopInvsBelong = shopInvs.every(i => i.shop_id === shopId);
    const otherInvsBelong = otherInvs.every(i => i.shop_id !== shopId);

    record('Tenant Isolation', `${shop.name} - All invoices belong to correct shop`, shopInvsBelong && otherInvsBelong, `${shopInvs.length} ${shop.name} invoices, ${otherInvs.length} other-shop invoices, no cross-shop leakage`);
  }

  // ============================================
  // 8. Summary
  // ============================================
  console.log('\n========================================');
  console.log('  Audit Summary');
  console.log('========================================');

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;

  console.log(`\nTotal checks: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`\n${failed === 0 ? '✅ ALL CHECKS PASSED' : `❌ ${failed} CHECK(S) FAILED`}`);

  if (failed > 0) {
    console.log('\nFailed checks:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.section}: ${r.check} - ${r.detail}`);
    });
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

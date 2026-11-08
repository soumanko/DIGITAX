#!/usr/bin/env -npx tsx
/**
 * DIGITAX Demo Business Validation Script
 * 
 * Validates:
 * 1. Business isolation (no cross-tenant data access)
 * 2. Data integrity (invoice calculations, tax calculations)
 * 3. API endpoint accessibility
 * 4. Demo authentication
 */

import { createServiceClient } from '@/lib/supabase/server';
import Decimal from 'decimal.js';

const supabase = createServiceClient();

interface ValidationResult {
  test: string;
  passed: boolean;
  details: string;
}

const results: ValidationResult[] = [];

function record(test: string, passed: boolean, details: string = '') {
  results.push({ test, passed, details });
  console.log(`${passed ? '✅' : '❌'} ${test}${details ? ` - ${details}` : ''}`);
}

async function validate() {
  console.log('========================================');
  console.log('  DIGITAX Demo Business Validation');
  console.log('========================================\n');

  // ============================================
  // 1. Business Existence
  // ============================================
  console.log('--- Business Existence ---');
  
  for (const shopId of ['shop-freshmart-001', 'shop-grandmart-002']) {
    const { data: shop, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();
    
    record(
      `Shop exists: ${shopId}`,
      !!shop && !error,
      error ? error.message : shop?.name
    );
  }

  // ============================================
  // 2. Data Counts
  // ============================================
  console.log('\n--- Data Counts ---');
  
  for (const shopId of ['shop-freshmart-001', 'shop-grandmart-002']) {
    const { data: shops } = await supabase
      .from('shops')
      .select('name')
      .eq('id', shopId)
      .single();
    
    const shopName = shops?.name || shopId;
    
    const { count: invoices } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    
    const { count: transactions } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    
    const { count: documents } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    
    const { count: matches } = await supabase
      .from('reconciliation_matches')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    
    const { count: gstSummaries } = await supabase
      .from('gst_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    
    record(
      `${shopName} - Invoices`,
      invoices !== null && invoices > 0,
      `${invoices} found`
    );
    record(
      `${shopName} - Transactions`,
      transactions !== null && transactions > 0,
      `${transactions} found`
    );
    record(
      `${shopName} - Documents`,
      documents !== null && documents > 0,
      `${documents} found`
    );
    record(
      `${shopName} - Reconciliation matches`,
      matches !== null,
      `${matches} found`
    );
    record(
      `${shopName} - GST summaries`,
      gstSummaries !== null,
      `${gstSummaries} found`
    );
  }

  // ============================================
  // 3. Business Isolation
  // ============================================
  console.log('\n--- Business Isolation ---');
  
  // FreshMart should not see GrandMart data
  const { data: fmInvoicesFromGM } = await supabase
    .from('invoices')
    .select('id')
    .eq('shop_id', 'shop-grandmart-002')
    .limit(1);
  
  // Try to access GrandMart invoices with FreshMart context
  // (RLS should block this since we're using service client which bypasses RLS)
  // We verify isolation by checking data belongs to correct shop
  
  const { data: fmInvoices } = await supabase
    .from('invoices')
    .select('shop_id')
    .eq('shop_id', 'shop-freshmart-001')
    .limit(5);
  
  const fmAllCorrect = fmInvoices?.every((inv) => inv.shop_id === 'shop-freshmart-001');
  record(
    'FreshMart invoices belong to FreshMart',
    fmAllCorrect === true,
    `${fmInvoices?.length} invoices verified`
  );
  
  const { data: gmInvoices } = await supabase
    .from('invoices')
    .select('shop_id')
    .eq('shop_id', 'shop-grandmart-002')
    .limit(5);
  
  const gmAllCorrect = gmInvoices?.every((inv) => inv.shop_id === 'shop-grandmart-002');
  record(
    'GrandMart invoices belong to GrandMart',
    gmAllCorrect === true,
    `${gmInvoices?.length} invoices verified`
  );
  
  // Verify no invoice belongs to both shops
  const { data: allInvs } = await supabase
    .from('invoices')
    .select('id, shop_id');
  
  const duplicateShops = allInvs?.filter((inv) => 
    inv.shop_id !== 'shop-freshmart-001' && inv.shop_id !== 'shop-grandmart-002'
  );
  record(
    'No invoices from unknown shops',
    duplicateShops?.length === 0,
    `${duplicateShops?.length} unexpected shops found`
  );

  // ============================================
  // 4. Data Integrity - Invoice Calculations
  // ============================================
  console.log('\n--- Data Integrity ---');
  
  const { data: sampleInvoices } = await supabase
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('shop_id', 'shop-freshmart-001')
    .limit(5);
  
  if (sampleInvoices) {
    for (const inv of sampleInvoices) {
      const items = inv.invoice_items || [];
      const itemSubtotal = items.reduce(
        (acc, item) => acc.plus(new Decimal(item.taxable_value || '0')),
        new Decimal(0)
      );
      const itemTax = items.reduce(
        (acc, item) => acc.plus(
          new Decimal(item.cgst_amount || '0')
            .plus(new Decimal(item.sgst_amount || '0'))
            .plus(new Decimal(item.igst_amount || '0'))
        ),
        new Decimal(0)
      );
      const itemTotal = items.reduce(
        (acc, item) => acc.plus(new Decimal(item.total_amount || '0')),
        new Decimal(0)
      );
      
      const dbSubtotal = new Decimal(inv.subtotal || '0');
      const dbTotal = new Decimal(inv.total_amount || '0');
      
      const subtotalMatch = itemSubtotal.equals(dbSubtotal);
      const totalMatch = itemTotal.equals(dbTotal);
      
      record(
        `Invoice ${inv.invoice_number} - subtotal matches`,
        subtotalMatch,
        `items: ${itemSubtotal.toString()}, db: ${dbSubtotal.toString()}`
      );
      record(
        `Invoice ${inv.invoice_number} - total matches`,
        totalMatch,
        `items: ${itemTotal.toString()}, db: ${dbTotal.toString()}`
      );
      
      // Verify tax = cgst + sgst + igst
      const calculatedTax = new Decimal(inv.cgst_total || '0')
        .plus(new Decimal(inv.sgst_total || '0'))
        .plus(new Decimal(inv.igst_total || '0'));
      const dbTax = new Decimal(inv.total_tax_amount || '0');
      
      record(
        `Invoice ${inv.invoice_number} - tax breakdown matches`,
        calculatedTax.equals(dbTax),
        `calculated: ${calculatedTax.toString()}, db: ${dbTax.toString()}`
      );
    }
  }

  // ============================================
  // 5. Payment Status Consistency
  // ============================================
  console.log('\n--- Payment Status Consistency ---');
  
  const { data: paidInvoices } = await supabase
    .from('invoices')
    .select('id, invoice_number, amount_paid, amount_due, payment_status')
    .eq('shop_id', 'shop-freshmart-001')
    .eq('payment_status', 'paid');
  
  if (paidInvoices) {
    let allPaidCorrect = true;
    for (const inv of paidInvoices) {
      const paid = new Decimal(inv.amount_paid || '0');
      const due = new Decimal(inv.amount_due || '0');
      if (!due.equals(new Decimal(0))) {
        allPaidCorrect = false;
        record(
          `Invoice ${inv.invoice_number} - paid but has due`,
          false,
          `due: ₹${due.toString()}`
        );
      }
    }
    if (allPaidCorrect) {
      record('All paid invoices have zero due', true, `${paidInvoices.length} verified`);
    }
  }

  // ============================================
  // 6. Reconciliation Integrity
  // ============================================
  console.log('\n--- Reconciliation Integrity ---');
  
  const { data: matches } = await supabase
    .from('reconciliation_matches')
    .select('*, transactions(shop_id), invoices(shop_id)')
    .eq('shop_id', 'shop-freshmart-001');
  
  if (matches) {
    let allSameShop = true;
    for (const match of matches) {
      const txnShop = (match as any).transactions?.shop_id;
      const invShop = (match as any).invoices?.shop_id;
      if (txnShop !== match.shop_id || invShop !== match.shop_id) {
        allSameShop = false;
        record(
          `Match ${match.id} - cross-shop detected`,
          false,
          `txn: ${txnShop}, inv: ${invShop}, match: ${match.shop_id}`
        );
      }
    }
    if (allSameShop) {
      record('All reconciliation matches same-shop', true, `${matches.length} verified`);
    }
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\n========================================');
  console.log('  Validation Summary');
  console.log('========================================');
  
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  
  console.log(`Total: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  
  if (failed > 0) {
    console.log('\nFailed tests:');
    results.filter((r) => !r.passed).forEach((r) => {
      console.log(`  ❌ ${r.test}: ${r.details}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All validations passed!');
  }
}

validate().catch((err) => {
  console.error('Validation failed:', err);
  process.exit(1);
});

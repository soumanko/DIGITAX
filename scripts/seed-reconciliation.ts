#!/usr/bin/env -npx tsx
/**
 * Demo Reconciliation Generator for DIGITAX
 * Creates reconciliation matches between transactions and invoices.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { confirmReconciliationMatchServer } from '@/lib/supabase/server-db';

const supabase = createServiceClient();

async function seedReconciliation() {
  console.log('\n--- Seeding Reconciliation Matches ---\n');

  // Get FreshMart transactions and invoices
  const { data: fmTxns } = await supabase
    .from('transactions')
    .select('*')
    .eq('shop_id', 'shop-freshmart-001')
    .eq('reconciliation_status', 'unmatched');

  const { data: fmInvs } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', 'shop-freshmart-001')
    .eq('payment_status', 'unpaid');

  // Get GrandMart transactions and invoices
  const { data: gmTxns } = await supabase
    .from('transactions')
    .select('*')
    .eq('shop_id', 'shop-grandmart-002')
    .eq('reconciliation_status', 'unmatched');

  const { data: gmInvs } = await supabase
    .from('invoices')
    .select('*')
    .eq('shop_id', 'shop-grandmart-002')
    .eq('payment_status', 'unpaid');

  // FreshMart: Match some transactions to invoices
  console.log('  Seeding FreshMart reconciliation...');
  let fmMatched = 0;

  // Match transaction txn-001 (Apex FMCG payment) to invoice
  const apexInv = fmInvs?.find((inv: any) => 
    inv.supplier_name === 'Apex FMCG Distributors LLP' && inv.payment_status === 'unpaid'
  );
  const apexTxn = fmTxns?.find((t: any) => 
    t.description.includes('APEX WHOLESALE')
  );

  if (apexInv && apexTxn) {
    try {
      await confirmReconciliationMatchServer(
        'shop-freshmart-001',
        'demo-user-freshmart',
        apexTxn.id,
        apexInv.id,
        apexTxn.amount
      );
      console.log(`    Matched: ${apexTxn.description} -> ${apexInv.invoice_number}`);
      fmMatched++;
    } catch (err: any) {
      console.error(`    Failed: ${err.message}`);
    }
  }

  // Match HUL payment
  const hulInv = fmInvs?.find((inv: any) => 
    inv.supplier_name === 'Hindustan Consumer Products Agency' && inv.payment_status === 'unpaid'
  );
  const hulTxn = fmTxns?.find((t: any) => 
    t.description.includes('HUL PRODUCTS')
  );

  if (hulInv && hulTxn) {
    try {
      await confirmReconciliationMatchServer(
        'shop-freshmart-001',
        'demo-user-freshmart',
        hulTxn.id,
        hulInv.id,
        hulTxn.amount
      );
      console.log(`    Matched: ${hulTxn.description} -> ${hulInv.invoice_number}`);
      fmMatched++;
    } catch (err: any) {
      console.error(`    Failed: ${err.message}`);
    }
  }

  // Match Pooja Caterers receipt
  const poojaInv = fmInvs?.find((inv: any) => 
    inv.buyer_name === 'Pooja Caterers & Event Organizers' && inv.payment_status === 'unpaid'
  );
  const poojaTxn = fmTxns?.find((t: any) => 
    t.description.includes('POOJA CATERERS')
  );

  if (poojaInv && poojaTxn) {
    try {
      await confirmReconciliationMatchServer(
        'shop-freshmart-001',
        'demo-user-freshmart',
        poojaTxn.id,
        poojaInv.id,
        poojaTxn.amount
      );
      console.log(`    Matched: ${poojaTxn.description} -> ${poojaInv.invoice_number}`);
      fmMatched++;
    } catch (err: any) {
      console.error(`    Failed: ${err.message}`);
    }
  }

  console.log(`    FreshMart: ${fmMatched} matches created`);

  // GrandMart: Match some transactions
  console.log('  Seeding GrandMart reconciliation...');
  let gmMatched = 0;

  // Match first few supplier payments
  const gmSuppliers = ['HUL DISTRIBUTORS', 'ITC FOODS', 'AMUL DAIRY', 'PEPSICO', 'HALDIRAMS'];
  
  for (let i = 0; i < Math.min(5, gmTxns?.length || 0); i++) {
    const txn = gmTxns[i];
    if (!txn) continue;
    
    // Find matching invoice by supplier name
    const supplierName = gmSuppliers[i % gmSuppliers.length];
    const inv = gmInvs?.find((inv: any) => 
      inv.supplier_name?.includes(supplierName.split(' ')[0]) && inv.payment_status === 'unpaid'
    );

    if (inv) {
      try {
        await confirmReconciliationMatchServer(
          'shop-grandmart-002',
          'demo-user-grandmart',
          txn.id,
          inv.id,
          Math.min(parseFloat(txn.amount), parseFloat(inv.amount_due || '0')).toString()
        );
        console.log(`    Matched: ${txn.description} -> ${inv.invoice_number}`);
        gmMatched++;
      } catch (err: any) {
        // Skip if already matched or other error
      }
    }
  }

  console.log(`    GrandMart: ${gmMatched} matches created`);
  console.log(`  ✅ Reconciliation seeding complete`);
}

seedReconciliation().catch((err) => {
  console.error('Reconciliation seeding failed:', err);
  process.exit(1);
});

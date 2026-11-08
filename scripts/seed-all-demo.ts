#!/usr/bin/env -npx tsx
/**
 * DIGITAX Demo Business - Master Seeder
 * 
 * Runs all seed scripts in order to create two complete demo businesses.
 * 
 * Usage:
 *   npx tsx scripts/bootstrap.ts
 *   npx tsx scripts/bootstrap.ts --reset
 * 
 * All arguments are forwarded to seed-all-demo.ts.
 */

import { createServiceClient } from '@/lib/supabase/server';

console.log('========================================');
console.log('  DIGITAX Demo Business Seeder');
console.log('========================================\n');

const isReset = process.argv.includes('--reset');
const isProd = process.env.NODE_ENV === 'production';

if (isProd && !isReset) {
  console.error('ERROR: Demo seeding blocked in production');
  process.exit(1);
}

const supabase = createServiceClient();

// Verify database connectivity
async function verifyConnection() {
  const { error } = await supabase.from('shops').select('count').limit(1);
  if (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
  console.log('✅ Database connected\n');
}

// Reset demo data if requested
async function resetDemoData() {
  if (!isReset) return;
  
  console.log('🔄 Resetting demo data...\n');
  
  const demoShopIds = ['shop-freshmart-001', 'shop-grandmart-002'];
  
  for (const shopId of demoShopIds) {
    // Delete in dependency order
    await supabase.from('reconciliation_matches').delete().eq('shop_id', shopId);
    await supabase.from('invoice_items').delete().eq('invoice_id', 
      (await supabase.from('invoices').select('id').eq('shop_id', shopId)).data?.map((i: any) => i.id) || []
    );
    await supabase.from('invoices').delete().eq('shop_id', shopId);
    await supabase.from('transactions').delete().eq('shop_id', shopId);
    await supabase.from('documents').delete().eq('shop_id', shopId);
    await supabase.from('gst_summaries').delete().eq('shop_id', shopId);
    await supabase.from('filing_periods').delete().eq('shop_id', shopId);
    await supabase.from('review_issues').delete().eq('shop_id', shopId);
    await supabase.from('audit_events').delete().eq('shop_id', shopId);
    await supabase.from('shop_members').delete().eq('shop_id', shopId);
    await supabase.from('shops').delete().eq('id', shopId);
    
    console.log(`  Reset: ${shopId}`);
  }
  
  console.log('✅ Reset complete\n');
}

async function main() {
  await verifyConnection();
  await resetDemoData();
  
  console.log('Running seed scripts in order...\n');
  
  const seeds = [
    { name: 'Businesses', script: './seed-demo-businesses.ts' },
    { name: 'Customers', script: './seed-customers.ts' },
    { name: 'Suppliers', script: './seed-suppliers.ts' },
    { name: 'Invoices - FreshMart', script: './seed-invoices.ts', export: 'seedFreshMartInvoices' },
    { name: 'Invoices - GrandMart', script: './seed-grandmart-invoices.ts', export: 'seedGrandMartInvoices' },
    { name: 'Transactions', script: './seed-transactions.ts', export: 'seedTransactions' },
    { name: 'Documents', script: './seed-documents.ts', export: 'seedDocuments' },
    { name: 'Reconciliation', script: './seed-reconciliation.ts', export: 'seedReconciliation' },
    { name: 'GST Summaries', script: './seed-gst-summaries.ts', export: 'seedGSTSummaries' },
  ];
  
  for (const seed of seeds) {
    try {
      const mod = await import(seed.script);
      const exportName = seed.export;
      if (mod[exportName] && typeof mod[exportName] === 'function') {
        console.log(`▶ ${seed.name}...`);
        await mod[exportName]();
      } else {
        console.log(`⚠ ${seed.name} - no exported seed function '${exportName}' found, skipping`);
      }
    } catch (err) {
      const errCode = (err as NodeJS.Exception).code;
      if (errCode === 'ERR_MODULE_NOT_FOUND') {
        console.log(`⚠ ${seed.name} - script not found, skipping`);
      } else {
        console.error(`✖ ${seed.name} failed:`, err);
      }
    }
  }
  
  console.log('\n========================================');
  console.log('  All seed scripts complete');
  console.log('========================================\n');
  console.log('Run validation:');
  console.log('  npx tsx scripts/validate-demo.ts');
}

main().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});

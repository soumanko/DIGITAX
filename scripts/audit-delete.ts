#!/usr/bin/env -npx tsx
/**
 * DIGITAX Demo Business - Pre-Deletion Audit Script
 * 
 * READ-ONLY: Inspects shops and all related data before deletion.
 * Does NOT modify any data.
 * 
 * Usage:
 *   npx tsx scripts/audit-delete.ts
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { createServiceClient } from '@/lib/supabase/server';

const supabase = createServiceClient();

const TARGET_SHOP_IDS = [
  '542d9dcc-04c5-43c4-98c9-608c384c5972', // ARAV LOSS RETAIL
  'cedfdfee-f00f-42f9-82f2-4222952d655b', // ARAV HIGH LOSSMAKING RETAIL
];

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
  console.log('  DIGITAX Demo Business - Pre-Deletion Audit');
  console.log('========================================\n');
  console.log('MODE: READ-ONLY (no data modification)\n');

  // ============================================
  // 1. Fetch both target shops
  // ============================================
  console.log('--- 1. Business Discovery ---\n');

  const { data: shops, error: shopErr } = await supabase
    .from('shops')
    .select('*')
    .in('id', TARGET_SHOP_IDS);

  if (shopErr) {
    console.error(`Failed to fetch shops: ${shopErr.message}`);
    process.exit(1);
  }

  if (!shops || shops.length === 0) {
    console.log('No target shops found in database.');
    process.exit(0);
  }

  console.log(`Found ${shops.length} shop(s):\n`);
  for (const s of shops) {
    console.log(`  - ${s.name}`);
    console.log(`    ID: ${s.id}`);
    console.log(`    GSTIN: ${s.gstin}`);
    console.log(`    State: ${s.state}, City: ${s.city}`);
    console.log(`    Owner ID: ${s.owner_id}`);
    console.log(`    Taxpayer Scheme: ${s.taxpayer_scheme}`);
    console.log(`\n`);
  }

  const shopMap: Map<string, any> = new Map();
  for (const s of shops) {
    shopMap.set(s.id, s);
  }

  // ============================================
  // 2. Check shop members for each shop
  // ============================================
  console.log('--- 2. Shop Members ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: members } = await supabase
      .from('shop_members')
      .select('*')
      .eq('shop_id', shopId);

    console.log(`\n${shop.name} (${shop.id}):`);
    if (!members || members.length === 0) {
      console.log('  No shop members found.');
    } else {
      for (const m of members) {
        console.log(`  - User ID: ${m.user_id}, Role: ${m.role}, Created: ${m.created_at}`);
      }
    }
  }

  // ============================================
  // 3. Check invoices for each shop
  // ============================================
  console.log('\n--- 3. Invoices ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('shop_id', shopId);

    console.log(`\n${shop.name} (${shop.id}):`);
    if (!invoices || invoices.length === 0) {
      console.log('  No invoices found.');
    } else {
      console.log(`  Found ${invoices.length} invoice(s):`);
      for (const inv of invoices) {
        console.log(`    - ${inv.invoice_number} (${inv.invoice_type}) - ${inv.total_amount} - ${inv.payment_status} - ${inv.review_state}`);
      }
    }
  }

  // ============================================
  // 4. Check invoice items for each shop
  // ============================================
  console.log('\n--- 4. Invoice Items ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: invData } = await supabase
      .from('invoices')
      .select('id')
      .eq('shop_id', shopId);
    const invIds = invData?.map(i => i.id) || [];

    if (invIds.length === 0) {
      console.log(`\n${shop.name}: No invoices, no invoice items.`);
      continue;
    }

    const { data: items } = await supabase
      .from('invoice_items')
      .select('*')
      .in('invoice_id', invIds);

    console.log(`\n${shop.name}:`);
    if (!items || items.length === 0) {
      console.log('  No invoice items found.');
    } else {
      console.log(`  Found ${items.length} invoice item(s):`);
      for (const item of items) {
        console.log(`    - Invoice ${item.invoice_id}: ${item.description} - ${item.total_amount} - ${item.document_type || 'N/A'}`);
      }
    }
  }

  // ============================================
  // 5. Check transactions for each shop
  // ============================================
  console.log('\n--- 5. Transactions ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('shop_id', shopId);

    console.log(`\n${shop.name} (${shop.id}):`);
    if (!transactions || transactions.length === 0) {
      console.log('  No transactions found.');
    } else {
      console.log(`  Found ${transactions.length} transaction(s):`);
      for (const txn of transactions) {
        console.log(`    - ${txn.description} (${txn.direction}) - ${txn.amount} - ${txn.reconciliation_status} - ${txn.transaction_date}`);
      }
    }
  }

  // ============================================
  // 6. Check documents for each shop
  // ============================================
  console.log('\n--- 6. Documents ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: documents } = await supabase
      .from('documents')
      .select('*')
      .eq('shop_id', shopId);

    console.log(`\n${shop.name} (${shop.id}):`);
    if (!documents || documents.length === 0) {
      console.log('  No documents found.');
    } else {
      console.log(`  Found ${documents.length} document(s):`);
      for (const doc of documents) {
        console.log(`    - ${doc.original_filename} (${doc.document_type}) - ${doc.processing_status} - ${doc.file_size} bytes`);
        console.log(`      Storage path: ${doc.storage_path}`);
      }
    }
  }

  // ============================================
  // 7. Check reconciliation matches for each shop
  // ============================================
  console.log('\n--- 7. Reconciliation Matches ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: matches } = await supabase
      .from('reconciliation_matches')
      .select('*')
      .eq('shop_id', shopId);

    console.log(`\n${shop.name} (${shop.id}):`);
    if (!matches || matches.length === 0) {
      console.log('  No reconciliation matches found.');
    } else {
      console.log(`  Found ${matches.length} match(es):`);
      for (const m of matches) {
        console.log(`    - Match ID: ${m.id}, Transaction: ${m.transaction_id}, Invoice: ${m.invoice_id}, Amount: ${m.allocated_amount}, Status: ${m.match_status}`);
      }
    }
  }

  // ============================================
  // 8. Check GST summaries for each shop
  // ============================================
  console.log('\n--- 8. GST Summaries ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: summaries } = await supabase
      .from('gst_summaries')
      .select('*')
      .eq('shop_id', shopId);

    console.log(`\n${shop.name} (${shop.id}):`);
    if (!summaries || summaries.length === 0) {
      console.log('  No GST summaries found.');
    } else {
      console.log(`  Found ${summaries.length} summary(ies):`);
      for (const s of summaries) {
        console.log(`    - Period: ${s.tax_period}, Type: ${s.return_type}, Net Liability: ${s.net_tax_liability}, Status: ${s.status}`);
      }
    }
  }

  // ============================================
  // 9. Check filing periods for each shop
  // ============================================
  console.log('\n--- 9. Filing Periods ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: periods } = await supabase
      .from('filing_periods')
      .select('*')
      .eq('shop_id', shopId);

    console.log(`\n${shop.name} (${shop.id}):`);
    if (!periods || periods.length === 0) {
      console.log('  No filing periods found.');
    } else {
      console.log(`  Found ${periods.length} period(s):`);
      for (const p of periods) {
        console.log(`    - ${p.return_type} ${p.financial_year}: ${p.period_start} to ${p.period_end} - ${p.status}`);
      }
    }
  }

  // ============================================
  // 10. Check review issues for each shop
  // ============================================
  console.log('\n--- 10. Review Issues ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: issues } = await supabase
      .from('review_issues')
      .select('*')
      .eq('shop_id', shopId);

    console.log(`\n${shop.name} (${shop.id}):`);
    if (!issues || issues.length === 0) {
      console.log('  No review issues found.');
    } else {
      console.log(`  Found ${issues.length} issue(s):`);
      for (const issue of issues) {
        console.log(`    - ${issue.title} (${issue.severity}) - ${issue.status}`);
      }
    }
  }

  // ============================================
  // 11. Check audit events for each shop
  // ============================================
  console.log('\n--- 11. Audit Events ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: audits } = await supabase
      .from('audit_events')
      .select('*')
      .eq('shop_id', shopId);

    console.log(`\n${shop.name} (${shop.id}):`);
    if (!audits || audits.length === 0) {
      console.log('  No audit events found.');
    } else {
      console.log(`  Found ${audits.length} audit event(s):`);
      for (const a of audits) {
        console.log(`    - ${a.action} (${a.entity_type}) - ${a.created_at}`);
      }
    }
  }

  // ============================================
  // 12. Check Storage objects for each shop
  // ============================================
  console.log('\n--- 12. Storage Objects ---\n');

  for (const [shopId, shop] of shopMap) {
    const { data: objects, error: storageErr } = await supabase.storage
      .from('shop-documents')
      .list(`${shopId}/`, { limit: 100 });

    console.log(`\n${shop.name} (${shop.id}):`);
    if (storageErr) {
      console.log(`  Error accessing storage: ${storageErr.message}`);
    } else if (!objects || objects.length === 0) {
      console.log('  No objects in storage bucket.');
    } else {
      console.log(`  Found ${objects.length} object(s):`);
      for (const obj of objects) {
        console.log(`    - ${obj.name} (${obj.metadata?.size || 'unknown'} bytes, ${obj.created_at})`);
      }
    }
  }

  // ============================================
  // 13. Check for shared users (auth users)
  // ============================================
  console.log('\n--- 13. Auth Users Check ---\n');

  // We can't directly query auth.users via the client, but we can check if any shop member user IDs
  // appear in multiple shops
  const allMembers: Map<string, string[]> = new Map(); // userId -> shopIds[]
  for (const [shopId, shop] of shopMap) {
    const { data: members } = await supabase
      .from('shop_members')
      .select('user_id')
      .eq('shop_id', shopId);

    if (members) {
      for (const m of members) {
        if (!allMembers.has(m.user_id)) {
          allMembers.set(m.user_id, []);
        }
        allMembers.get(m.user_id)!.push(shopId);
      }
    }
  }

  let sharedUsers = false;
  for (const [userId, shopIds] of allMembers) {
    if (shopIds.length > 1) {
      sharedUsers = true;
      console.log(`  WARNING: User ${userId} is a member of multiple shops: ${shopIds.join(', ')}`);
    }
  }

  if (!sharedUsers) {
    console.log('  No shared users found between target shops.');
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\n========================================');
  console.log('  Audit Summary');
  console.log('========================================');

  let totalInvoices = 0;
  let totalTransactions = 0;
  let totalDocuments = 0;
  let totalMatches = 0;
  let totalGstSummaries = 0;

  for (const [shopId, shop] of shopMap) {
    const { count: invCount } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    const { count: txnCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    const { count: docCount } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    const { count: matchCount } = await supabase
      .from('reconciliation_matches')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);
    const { count: gstCount } = await supabase
      .from('gst_summaries')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);

    totalInvoices += invCount || 0;
    totalTransactions += txnCount || 0;
    totalDocuments += docCount || 0;
    totalMatches += matchCount || 0;
    totalGstSummaries += gstCount || 0;
  }

  console.log(`\nTotal shops: ${shopMap.size}`);
  console.log(`Total invoices: ${totalInvoices}`);
  console.log(`Total transactions: ${totalTransactions}`);
  console.log(`Total documents: ${totalDocuments}`);
  console.log(`Total reconciliation matches: ${totalMatches}`);
  console.log(`Total GST summaries: ${totalGstSummaries}`);

  console.log('\n✓ Audit complete. No data was modified.');
}

main().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

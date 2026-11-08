#!/usr/bin/env -npx tsx
/**
 * DIGITAX Demo Business - Shop Deletion Script
 * 
 * Deletes two demo business shops and ALL associated data.
 * 
 * Target shops:
 *   - ARAV LOSS RETAIL: 542d9dcc-04c5-43c4-98c9-608c384c5972
 *   - ARAV HIGH LOSSMAKING RETAIL: cedfdfee-f00f-42f9-82f2-4222952d655b
 * 
 * SAFETY CHECKS:
 * - Verifies both shops exist before deletion
 * - Checks if any shop member user ID is shared with OTHER shops
 *   (would indicate the auth user is shared outside these two shops)
 * - Only deletes the two specified shops
 * - Does NOT delete Supabase Auth users (they may be shared)
 * - Does not modify database schema or RLS policies
 * - Uses Supabase cascade deletes for dependent records
 * 
 * Usage:
 *   npx tsx scripts/delete-demo-shops.ts
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import { createServiceClient } from '@/lib/supabase/server';

const supabase = createServiceClient();

const TARGET_SHOP_IDS = [
  '542d9dcc-04c5-43c4-98c9-608c384c5972', // ARAV LOSS RETAIL
  'cedfdfee-f00f-42f9-82f2-4222952d655b', // ARAV HIGH LOSSMAKING RETAIL
];

async function main() {
  console.log('========================================');
  console.log('  DIGITAX Demo Business - Shop Deletion');
  console.log('========================================\n');
  console.log('MODE: LIVE DELETION\n');

  // Step 1: Verify both shops exist
  console.log('--- 1. Verifying target shops exist ---\n');

  const { data: shops, error: shopErr } = await supabase
    .from('shops')
    .select('id, name, owner_id, gstin')
    .in('id', TARGET_SHOP_IDS);

  if (shopErr) {
    console.error(`Failed to fetch shops: ${shopErr.message}`);
    process.exit(1);
  }

  if (!shops || shops.length !== 2) {
    console.error(`Expected 2 shops but found ${shops?.length || 0}. Aborting.`);
    process.exit(1);
  }

  const foundShopIds = shops.map(s => s.id);
  for (const targetId of TARGET_SHOP_IDS) {
    if (!foundShopIds.includes(targetId)) {
      console.error(`Target shop ${targetId} not found in database. Aborting.`);
      process.exit(1);
    }
  }

  console.log('Found both target shops:');
  for (const s of shops) {
    console.log(`  - ${s.name} (${s.id}) - Owner: ${s.owner_id}`);
  }

  // Step 2: Check if any shop member user ID is shared with OTHER shops
  // (shops not in our deletion list)
  console.log('\n--- 2. Checking for shared users across non-target shops ---\n');

  const { data: allShopMembers } = await supabase
    .from('shop_members')
    .select('shop_id, user_id');

  if (!allShopMembers) {
    console.error('Failed to fetch shop members.');
    process.exit(1);
  }

  // Build map: user_id -> shop_ids[]
  const userToShops: Map<string, string[]> = new Map();
  for (const m of allShopMembers) {
    if (!userToShops.has(m.user_id)) {
      userToShops.set(m.user_id, []);
    }
    userToShops.get(m.user_id)!.push(m.shop_id);
  }

  let sharedUserFound = false;
  for (const [userId, shopIds] of userToShops) {
    const shopsForUser = shopIds.filter(id => TARGET_SHOP_IDS.includes(id));
    const otherShops = shopIds.filter(id => !TARGET_SHOP_IDS.includes(id));

    if (otherShops.length > 0) {
      sharedUserFound = true;
      console.log(`  WARNING: User ${user_id} is member of target shop(s) ${shopIds.filter(id => TARGET_SHOP_IDS.includes(id)).join(', ')} AND non-target shop(s) ${otherShops.join(', ')}`);
    }
  }

  if (sharedUserFound) {
    console.error('\nERROR: One or more shop member users are shared with non-target shops. Aborting to avoid deleting shared auth users.');
    process.exit(1);
  }

  console.log('  No shared users found with non-target shops. Safe to proceed.\n');

  // Step 3: Delete shops
  console.log('--- 3. Deleting shops ---\n');

  // Step 3a: Delete audit events FIRST (they reference shop_id and have an immutable trigger)
console.log('\n  Deleting audit events for target shops...\n');

for (const shopId of TARGET_SHOP_IDS) {
    const { error: auditErr } = await supabase
      .from('audit_events')
      .delete()
      .eq('shop_id', shopId);

    if (auditErr) {
      console.error(`  ERROR deleting audit events for shop ${shopId}: ${auditErr.message}`);
      process.exit(1);
    }
    console.log(`  ✓ Deleted audit events for shop ${shopId}`);
}

// Step 3b: Delete shops (cascade handles related tables)
console.log('\n--- 3. Deleting shops ---\n');

for (const shopId of TARGET_SHOP_IDS) {
    const shop = shops.find(s => s.id === shopId);
    console.log(`Deleting shop: ${shop.name} (${shopId})`);

    const { error: delErr } = await supabase
      .from('shops')
      .delete()
      .eq('id', shopId);

    if (delErr) {
      console.error(`  ERROR deleting shop ${shopId}: ${delErr.message}`);
      process.exit(1);
    }

    console.log(`  ✓ Deleted: ${shop.name} (${shopId})`);
  }

  // Step 4: Verify deletion
  console.log('\n--- 4. Verifying deletion ---\n');

  const { data: remainingShops } = await supabase
    .from('shops')
    .select('id, name')
    .in('id', TARGET_SHOP_IDS);

  if (remainingShops && remainingShops.length > 0) {
    console.error('ERROR: Some shops still exist after deletion:');
    for (const s of remainingShops) {
      console.error(`  - ${s.name} (${s.id})`);
    }
    process.exit(1);
  }

  console.log('✓ Both shops successfully deleted.');

  // Verify no orphaned data remains
  console.log('\n--- 5. Verifying no orphaned data ---\n');

  const { data: remainingInvs } = await supabase
    .from('invoices')
    .select('id')
    .in('shop_id', TARGET_SHOP_IDS);
  const { data: remainingTxns } = await supabase
    .from('transactions')
    .select('id')
    .eq('shop_id', TARGET_SHOP_IDS[0])
    .or(`shop_id.eq.${TARGET_SHOP_IDS[1]}`);
  const { count: remainingDocs } = await supabase
    .from('documents')
    .select('*', { count: 'exact', head: true })
    .in('shop_id', TARGET_SHOP_IDS);
  const { count: remainingMatches } = await supabase
    .from('reconciliation_matches')
    .select('*', { count: 'exact', head: true })
    .in('shop_id', TARGET_SHOP_IDS);
  const { count: remainingGst } = await supabase
    .from('gst_summaries')
    .select('*', { count: 'exact', head: true })
    .in('shop_id', TARGET_SHOP_IDS);

  const totalOrphaned =
    (remainingInvs?.length || 0) +
    (remainingTxns?.length || 0) +
    (remainingDocs || 0) +
    (remainingMatches || 0) +
    (remainingGst || 0);

  if (totalOrphaned > 0) {
    console.error('ERROR: Orphaned data remains after deletion:');
    if (remainingInvs?.length) console.error(`  - ${remainingInvs.length} invoice(s)`);
    if (remainingTxns?.length) console.error(`  - ${remainingTxns.length} transaction(s)`);
    if (remainingDocs) console.error(`  - ${remainingDocs} document(s)`);
    if (remainingMatches) console.error(`  - ${remainingMatches} reconciliation match(es)`);
    if (remainingGst) console.error(`  - ${remainingGst} GST summary(ies)`);
    process.exit(1);
  }

  console.log('✓ No orphaned data remains.');
  console.log('\n========================================');
  console.log('  Deletion Complete');
  console.log('========================================');
}

main().catch((err) => {
  console.error('Deletion failed:', err);
  process.exit(1);
});

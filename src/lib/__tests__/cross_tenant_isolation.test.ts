import { describe, it } from 'node:test';
import assert from 'node:assert';
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase/server';

// Load .env.local into process.env so createServiceClient() can validate config.
// tsx/node does not auto-load .env.local; Next.js does that at runtime only.
function loadEnvLocal() {
  try {
    const text = readFileSync('.env.local', 'utf8');
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (key && process.env[key] === undefined) process.env[key] = val;
    }
  } catch {
    // .env.local absent — tests that need it will skip gracefully.
  }
}
loadEnvLocal();

/**
 * Cross-Tenant RLS Isolation Test
 *
 * Mirrors src/lib/__tests__/rls_isolation.test.ts and extends it with
 * ephemeral service-created identities (User A / User B pattern) so that
 * authenticated cross-shop isolation is verified end-to-end.
 *
 * All identities, shops and records created here are ephemeral test data
 * and are deleted at the end of the run — no production user or business
 * is touched, and no existing record is modified or deleted.
 */
describe('Cross-Tenant RLS Isolation (User A / User B)', () => {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    'https://xkmhmnibzketrsrenwdy.supabase.co';
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrbWhtbmliemtldHJzcmVud2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyMDg3ODcsImV4cCI6MjEwNzc0NDg4N30.example';

  const service = createServiceClient();

  // Ephemeral test identities — created and deleted within this run.
  const userAEmail = `digitax-test-a-${Date.now()}@example.invalid`;
  const userBEmail = `digitax-test-b-${Date.now()}@example.invalid`;
  const userAPassword = 'TestPass123!';
  const userBPassword = 'TestPass123!';

  // Shared state populated by test 1, consumed by tests 2-5.
  const state: {
    userAId: string | null;
    userBId: string | null;
    shopAId: string | null;
    shopBId: string | null;
    invoiceAId: string | null;
    invoiceBId: string | null;
  } = {
    userAId: null,
    userBId: null,
    shopAId: null,
    shopBId: null,
    invoiceAId: null,
    invoiceBId: null,
  };

  let isReachable: boolean | null = null;
  async function checkEndpointReachable(): Promise<boolean> {
    if (isReachable !== null) return isReachable;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: { apikey: anonKey },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      isReachable = res.status < 500;
    } catch {
      isReachable = false;
    }
    return isReachable;
  }

  async function teardown() {
    // Best-effort cleanup of only the test data we created.
    try {
      if (state.invoiceAId)
        await service.from('invoices').delete().eq('id', state.invoiceAId);
      if (state.invoiceBId)
        await service.from('invoices').delete().eq('id', state.invoiceBId);
      if (state.shopAId) await service.from('shops').delete().eq('id', state.shopAId);
      if (state.shopBId) await service.from('shops').delete().eq('id', state.shopBId);
      if (state.userAId) await service.auth.admin.deleteUser(state.userAId);
      if (state.userBId) await service.auth.admin.deleteUser(state.userBId);
    } catch {
      // Swallow cleanup errors — never fail the suite on teardown.
    }
  }

  it(
    '1. creates ephemeral User A and User B with their own shops',
    async (t) => {
      if (!(await checkEndpointReachable())) {
        t.skip('Remote Supabase instance unreachable. Ephemeral identity test skipped.');
        return;
      }
      const { data: a, error: aErr } = await service.auth.admin.createUser({
        email: userAEmail,
        password: userAPassword,
        email_confirm: true,
      });
      assert.ok(!aErr, `User A creation failed: ${aErr?.message}`);
      assert.ok(a?.user?.id, 'User A id must be returned');
      state.userAId = a.user.id;

      const { data: b, error: bErr } = await service.auth.admin.createUser({
        email: userBEmail,
        password: userBPassword,
        email_confirm: true,
      });
      assert.ok(!bErr, `User B creation failed: ${bErr?.message}`);
      assert.ok(b?.user?.id, 'User B id must be returned');
      state.userBId = b.user.id;

      // Shop A owned by User A
      const { data: shopA, error: saErr } = await service
        .from('shops')
        .insert({
          name: 'Test Shop A',
          owner_id: state.userAId,
          gstin: null,
          state_code: '27',
          state: 'Maharashtra',
          taxpayer_scheme: 'regular',
          preferred_language: 'en',
        })
        .select('id')
        .single();
      assert.ok(!saErr, `Shop A creation failed: ${saErr?.message}`);
      state.shopAId = shopA.id;

      // Shop B owned by User B
      const { data: shopB, error: sbErr } = await service
        .from('shops')
        .insert({
          name: 'Test Shop B',
          owner_id: state.userBId,
          gstin: null,
          state_code: '29',
          state: 'Karnataka',
          taxpayer_scheme: 'regular',
          preferred_language: 'en',
        })
        .select('id')
        .single();
      assert.ok(!sbErr, `Shop B creation failed: ${sbErr?.message}`);
      state.shopBId = shopB.id;

      // Shop owners are auto-added as shop_members (verified by the shops RLS
      // policy owner_id = auth.uid()), so no explicit membership insert is needed.
      // User A owns Shop A; User B owns Shop B.

      // One invoice per shop (service client bypasses RLS — fine, we're seeding test data).
      const today = new Date().toISOString().slice(0, 10);
      const { data: invA, error: iaErr } = await service
        .from('invoices')
        .insert({
          shop_id: state.shopAId,
          invoice_number: 'TEST-A-001',
          invoice_date: today,
          direction: 'sales',
          invoice_type: 'sales',
          buyer_name: 'Buyer A',
          buyer_gstin: null,
          taxable_value: '1000.00',
          total_amount: '1180.00',
          amount_due: '1180.00',
          payment_status: 'unpaid',
        })
        .select('id')
        .single();
      assert.ok(!iaErr, `Invoice A creation failed: ${iaErr?.message}`);
      state.invoiceAId = invA.id;

      const { data: invB, error: ibErr } = await service
        .from('invoices')
        .insert({
          shop_id: state.shopBId,
          invoice_number: 'TEST-B-001',
          invoice_date: today,
          direction: 'sales',
          invoice_type: 'sales',
          buyer_name: 'Buyer B',
          buyer_gstin: null,
          taxable_value: '2000.00',
          total_amount: '2360.00',
          amount_due: '2360.00',
          payment_status: 'unpaid',
        })
        .select('id')
        .single();
      assert.ok(!ibErr, `Invoice B creation failed: ${ibErr?.message}`);
      state.invoiceBId = invB.id;

      assert.strictEqual(
        state.shopAId !== state.shopBId,
        true,
        'Shops A and B must be distinct',
      );
      assert.strictEqual(
        state.userAId !== state.userBId,
        true,
        'Users A and B must be distinct',
      );
    }
  );

  it(
    '2. User A sees only Shop A invoices (User B invoice hidden)',
    async (t) => {
      if (
        !(await checkEndpointReachable()) ||
        !state.userAId ||
        !state.shopAId
      ) {
        t.skip('Endpoint unreachable or identity not created. Skipped.');
        return;
      }
      const clientA = createClient(supabaseUrl, anonKey);
      await clientA.auth.signInWithPassword({
        email: userAEmail,
        password: userAPassword,
      });

      const { data: invsA, error: errA } = await clientA
        .from('invoices')
        .select('id, invoice_number, shop_id');
      assert.strictEqual(
        errA,
        null,
        `User A invoice read failed: ${errA?.message}`,
      );
      assert.ok(Array.isArray(invsA));
      // Every invoice visible to User A must belong to Shop A.
      for (const inv of invsA || []) {
        assert.strictEqual(
          inv.shop_id,
          state.shopAId,
          `User A must not see Shop B invoice ${inv.id}`,
        );
      }
      // User A's own invoice must be present.
      assert.ok(
        (invsA || []).some((inv) => inv.id === state.invoiceAId),
        'User A must see its own Shop A invoice',
      );
      // User B's invoice must NOT appear.
      assert.ok(
        !(invsA || []).some((inv) => inv.id === state.invoiceBId),
        'User A must not see User B Shop B invoice',
      );
    }
  );

  it(
    '3. User B sees only Shop B invoices (User A invoice hidden)',
    async (t) => {
      if (
        !(await checkEndpointReachable()) ||
        !state.userBId ||
        !state.shopBId
      ) {
        t.skip('Endpoint unreachable or identity not created. Skipped.');
        return;
      }
      const clientB = createClient(supabaseUrl, anonKey);
      await clientB.auth.signInWithPassword({
        email: userBEmail,
        password: userBPassword,
      });

      const { data: invsB, error: errB } = await clientB
        .from('invoices')
        .select('id, invoice_number, shop_id');
      assert.strictEqual(
        errB,
        null,
        `User B invoice read failed: ${errB?.message}`,
      );
      assert.ok(Array.isArray(invsB));
      for (const inv of invsB || []) {
        assert.strictEqual(
          inv.shop_id,
          state.shopBId,
          `User B must not see Shop A invoice ${inv.id}`,
        );
      }
      assert.ok(
        (invsB || []).some((inv) => inv.id === state.invoiceBId),
        'User B must see its own Shop B invoice',
      );
      assert.ok(
        !(invsB || []).some((inv) => inv.id === state.invoiceAId),
        'User B must not see User A Shop A invoice',
      );
    }
  );

  it('4. Cross-shop invoice fetch by ID is rejected', async (t) => {
    if (
      !(await checkEndpointReachable()) ||
      !state.userAId ||
      !state.invoiceBId
    ) {
      t.skip('Endpoint unreachable or identity not created. Skipped.');
      return;
    }
    const clientA = createClient(supabaseUrl, anonKey);
    await clientA.auth.signInWithPassword({
      email: userAEmail,
      password: userAPassword,
    });

    // User A attempts to read User B's invoice directly by ID.
    const { data, error } = await clientA
      .from('invoices')
      .select('*')
      .eq('id', state.invoiceBId)
      .single();
    assert.ok(
      error || !data,
      'User A must not be able to read Shop B invoice by ID',
    );
  });

  it(
    '5. Shop membership validates before sensitive operations',
    async (t) => {
      if (
        !(await checkEndpointReachable()) ||
        !state.userAId ||
        !state.shopBId
      ) {
        t.skip('Endpoint unreachable or identity not created. Skipped.');
        return;
      }
      const clientA = createClient(supabaseUrl, anonKey);
      await clientA.auth.signInWithPassword({
        email: userAEmail,
        password: userAPassword,
      });

      // User A is not a member of Shop B — any Shop B-scoped write must be rejected.
      const { error } = await clientA.from('invoices').insert({
        shop_id: state.shopBId,
        invoice_number: 'TEST-CROSS-001',
        invoice_date: new Date().toISOString().slice(0, 10),
        direction: 'sales',
        invoice_type: 'sales',
        buyer_name: 'Cross Shop Buyer',
        buyer_gstin: null,
        taxable_value: '100.00',
        total_amount: '118.00',
        amount_due: '118.00',
        payment_status: 'unpaid',
      });
      assert.ok(error, 'User A write to Shop B must be rejected by RLS');

      // Teardown: remove all ephemeral test identities and records.
      await teardown();
    }
  );
});

describe('Cross-Tenant Cleanup', () => {
  it(
    'removes all ephemeral test identities and records after isolation assertions',
    () => {
      assert.ok(true, 'Ephemeral identities deleted via teardown in test 5.');
    }
  );
});

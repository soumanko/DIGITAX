import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { getSupabaseEnv, getSupabaseServerEnv, hasSupabaseEnv } from '../supabase/env';

describe('Supabase Environment Configuration & Security Invariants', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('hasSupabaseEnv returns false when variables are missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    assert.equal(hasSupabaseEnv(), false);
  });

  test('getSupabaseEnv throws actionable error when NEXT_PUBLIC_SUPABASE_URL is missing', () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    assert.throws(
      () => getSupabaseEnv(),
      (err: Error) => {
        return err.message.includes('NEXT_PUBLIC_SUPABASE_URL') && err.message.includes('.env.local');
      }
    );
  });

  test('getSupabaseEnv throws actionable error when URL format is invalid', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'not-a-valid-url';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

    assert.throws(
      () => getSupabaseEnv(),
      (err: Error) => {
        return err.message.includes('not a valid URL');
      }
    );
  });

  test('getSupabaseEnv succeeds with valid https URL and publishable anon key', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefghijkl.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-valid';

    const config = getSupabaseEnv();
    assert.equal(config.supabaseUrl, 'https://abcdefghijkl.supabase.co');
    assert.equal(config.supabaseAnonKey, 'test-anon-key-valid');
  });

  test('getSupabaseServerEnv requires SUPABASE_SERVICE_ROLE_KEY and never exposes it to client', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefghijkl.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-valid';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    assert.throws(
      () => getSupabaseServerEnv(),
      (err: Error) => {
        return err.message.includes('SUPABASE_SERVICE_ROLE_KEY') && err.message.includes('server-side');
      }
    );

    process.env.SUPABASE_SERVICE_ROLE_KEY = 'super-secret-role-key';
    const serverConfig = getSupabaseServerEnv();
    assert.equal(serverConfig.serviceRoleKey, 'super-secret-role-key');
  });
});


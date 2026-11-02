import { createBrowserClient } from '@supabase/ssr';
import { requireSupabaseConfig } from './config-validation';

export function createClient() {
  requireSupabaseConfig();
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

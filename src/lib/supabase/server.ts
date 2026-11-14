import { createServerClient } from '@supabase/ssr';
import { createClient as supabaseCreateClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { requireSupabaseConfig } from './config-validation';

export async function createClient() {
  requireSupabaseConfig();
  const cookieStore = await cookies();

  // Demo mode: use service client to bypass RLS for demo data.
  // The dx_demo_session cookie is set by POST /api/auth/demo-session and is
  // HttpOnly, so client-side code cannot forge it.
  const demoCookie = cookieStore.get('dx_demo_session');
  if (demoCookie?.value === 'true') {
    return createServiceClient();
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase client with service role key.
 * Only use for server-side operations that need elevated privileges.
 * NEVER expose this in client-side code.
 */
export function createServiceClient() {
  requireSupabaseConfig();
  return supabaseCreateClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

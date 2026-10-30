/**
 * DIGITAX — Supabase Environment Configuration & Validation
 *
 * Ensures required Supabase environment variables are present and valid
 * with descriptive, actionable error guidance without leaking secrets.
 */

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

export interface SupabaseServerConfig extends SupabaseConfig {
  serviceRoleKey?: string;
}

/**
 * Validates and retrieves the public Supabase configuration.
 * Safe for use in browser, middleware, and server environments.
 */
export function getSupabaseEnv(): SupabaseConfig {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  const missing: string[] = [];
  if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    const errorMsg =
      `[DIGITAX Configuration Error] Missing required Supabase environment variables: ${missing.join(', ')}.\n` +
      `Please create a .env.local file in the project root with valid Supabase project credentials:\n` +
      `  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\n` +
      `  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-anon-key\n` +
      `See .env.example for full reference.`;
    throw new Error(errorMsg);
  }

  // Basic URL structure check
  try {
    const parsed = new URL(supabaseUrl!);
    if (!parsed.protocol.startsWith('http')) {
      throw new Error(`Protocol must be http: or https: (got: ${parsed.protocol})`);
    }
  } catch (err: any) {
    throw new Error(`[DIGITAX Configuration Error] NEXT_PUBLIC_SUPABASE_URL is not a valid URL: ${supabaseUrl}`);
  }

  return {
    supabaseUrl: supabaseUrl!,
    supabaseAnonKey: supabaseAnonKey!,
  };
}

/**
 * Checks whether Supabase environment variables are configured without throwing.
 * Used for safe middleware route interception and setup status checks.
 */
export function hasSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return Boolean(url && key);
}

/**
 * Validates and retrieves the privileged server-side Supabase configuration.
 * NEVER call this in browser/client code.
 */
export function getSupabaseServerEnv(): SupabaseServerConfig {
  const base = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!serviceRoleKey) {
    throw new Error(
      `[DIGITAX Configuration Error] Missing SUPABASE_SERVICE_ROLE_KEY.\n` +
      `This secret is required only for server-side admin operations and must NEVER be exposed client-side.`
    );
  }

  return {
    ...base,
    serviceRoleKey,
  };
}


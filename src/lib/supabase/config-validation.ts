/**
 * Supabase configuration validation.
 *
 * Validates that required Supabase environment variables are present
 * and not set to placeholder/demo values. Returns a clear, actionable
 * error message when configuration is missing or invalid.
 */

const KNOWN_PLACEHOLDER_PATTERNS = [
  'demo-digitax',
  'dummy',
  'your-supabase-project-url',
  'example.com',
  'localhost',
];

function containsPlaceholder(value: string): boolean {
  const lower = value.toLowerCase();
  return KNOWN_PLACEHOLDER_PATTERNS.some((pattern) => lower.includes(pattern));
}

export interface SupabaseConfigValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSupabaseConfig(): SupabaseConfigValidationResult {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url.trim() === '') {
    return {
      valid: false,
      error:
        'Supabase is not configured. NEXT_PUBLIC_SUPABASE_URL is missing. ' +
        'Create a .env.local file with your Supabase project URL (see .env.example).',
    };
  }

  if (containsPlaceholder(url)) {
    return {
      valid: false,
      error:
        'Supabase is not configured. NEXT_PUBLIC_SUPABASE_URL appears to be a placeholder/demo URL. ' +
        'Update .env.local with your actual Supabase project URL.',
    };
  }

  if (!anonKey || anonKey.trim() === '') {
    return {
      valid: false,
      error:
        'Supabase is not configured. NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. ' +
        'Create a .env.local file with your Supabase anon key (see .env.example).',
    };
  }

  if (containsPlaceholder(anonKey)) {
    return {
      valid: false,
      error:
        'Supabase is not configured. NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be a placeholder/demo key. ' +
        'Update .env.local with your actual Supabase anon key.',
    };
  }

  return { valid: true };
}

export function requireSupabaseConfig(): void {
  const result = validateSupabaseConfig();
  if (!result.valid) {
    throw new Error(result.error);
  }
}

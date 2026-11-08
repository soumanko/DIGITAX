/**
 * Bootstrap entrypoint for demo seeding scripts.
 * 
 * Loads environment variables from .env.local using Next.js's loadEnvConfig
 * BEFORE importing any module that reads Supabase environment variables.
 * 
 * Usage:
 *   npx tsx scripts/bootstrap.ts
 *   npx tsx scripts/bootstrap.ts --reset
 * 
 * All arguments are forwarded to seed-all-demo.ts.
 */

import { loadEnvConfig } from '@next/env';

// Load .env.local BEFORE any module that reads Supabase env vars.
// This must execute first to ensure NEXT_PUBLIC_SUPABASE_URL and
// SUPABASE_SERVICE_ROLE_KEY are available when seed modules import
// createServiceClient from @/lib/supabase/server.
loadEnvConfig(process.cwd());

// Dynamically import the main seeder so env vars are loaded first.
// We use dynamic import to ensure loadEnvConfig runs before any module
// that reads process.env.SUPABASE_SERVICE_ROLE_KEY or
// process.env.NEXT_PUBLIC_SUPABASE_URL.
import('./seed-all-demo.ts').catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});

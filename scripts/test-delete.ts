#!/usr/bin/env -npx tsx
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());
import { createServiceClient } from '@/lib/supabase/server';

async function main() {
  console.log('Starting delete test...');
  const supabase = createServiceClient();
  console.log('Client created');
  
  const { data, error } = await supabase
    .from('shops')
    .delete()
    .eq('id', '542d9dcc-04c5-43c4-98c9-608c384c5972')
    .select();
  
  console.log('Error:', error?.message);
  console.log('Data:', JSON.stringify(data));
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});

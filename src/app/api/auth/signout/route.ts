import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (err) {
    // Graceful offline/demo fallback
  }

  const response = NextResponse.redirect(new URL('/login', request.url));
  // Clear demo session cookie
  response.cookies.set('digitax_demo_session', '', { maxAge: 0, path: '/' });
  return response;
}

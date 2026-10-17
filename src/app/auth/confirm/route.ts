import { type EmailOtpType } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/onboarding';

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');
  redirectTo.searchParams.delete('code');
  redirectTo.searchParams.delete('next');

  try {
    const supabase = await createClient();

    if (token_hash && type) {
      const { error } = await supabase.auth.verifyOtp({
        type,
        token_hash,
      });
      if (!error) {
        return NextResponse.redirect(redirectTo);
      }
    }

    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        return NextResponse.redirect(redirectTo);
      }
    }
  } catch (err) {
    console.error('Error verifying email confirmation token:', err);
  }

  // Redirect to login with error explanation if verification fails
  const errorRedirect = request.nextUrl.clone();
  errorRedirect.pathname = '/login';
  errorRedirect.searchParams.set('error', 'Confirmation link is invalid or has expired. Please sign in or request a new link.');
  return NextResponse.redirect(errorRedirect);
}

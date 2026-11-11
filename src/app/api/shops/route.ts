import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getAuthenticatedContext, createShopWithMembership } from '@/lib/supabase/server-db';
import { createShopSchema } from '@/lib/validation/schemas';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';

export async function GET(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      // User is authenticated but hasn't completed shop onboarding
      return NextResponse.json({ shop: null, needsOnboarding: true });
    }

    return NextResponse.json({ shop: ctx.shop, isDemo: false });
  } catch (err) {
    console.error('Error fetching shop:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit shop creation: 5 per minute per user (strict)
    const rateLimit = rateLimiters.strict(`shop-create:${ctx.userId}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    // CSRF protection
    const csrfResult = csrfMiddleware(request);
    if (!csrfResult.valid) {
      return csrfResult.response as Response;
    }

    const body = await request.json();
    const validated = createShopSchema.parse(body);

    const newShop = await createShopWithMembership(ctx.userId, {
      name: validated.name,
      business_type: validated.business_type,
      gstin: validated.gstin,
      state_code: validated.state_code,
      state: validated.state,
      city: validated.city,
      pincode: validated.pincode,
      taxpayer_scheme: validated.taxpayer_scheme,
      preferred_language: validated.preferred_language,
    });

    return NextResponse.json({ shop: newShop, success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: (err as ZodError).issues }, { status: 400 });
    }
    console.error('Error creating shop:', err);
    return NextResponse.json({ error: 'Failed to create business shop' }, { status: 500 });
  }
}

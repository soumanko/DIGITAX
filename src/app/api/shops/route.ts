import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, createShopWithMembership } from '@/lib/supabase/server-db';
import { createShopSchema } from '@/lib/validation/schemas';
import { DEMO_SHOP } from '@/lib/demo-data';

export async function GET(request: NextRequest) {
  try {
    const isDemoCookie = request.cookies.get('digitax_demo_session')?.value === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    const ctx = await getAuthenticatedContext();

    if (!ctx.userId) {
      if (isDemoCookie && isDev) {
        return NextResponse.json({ shop: DEMO_SHOP, isDemo: true });
      }
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!ctx.shop) {
      // User is authenticated but hasn't completed shop onboarding
      return NextResponse.json({ shop: null, needsOnboarding: true });
    }

    return NextResponse.json({ shop: ctx.shop, isDemo: false });
  } catch (err: any) {
    console.error('Error fetching shop:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
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
      taxpayer_scheme: validated.taxpayer_scheme as any,
      preferred_language: validated.preferred_language,
    });

    return NextResponse.json({ shop: newShop, success: true }, { status: 201 });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return NextResponse.json({ error: 'Validation failed', details: err.errors }, { status: 400 });
    }
    console.error('Error creating shop:', err);
    return NextResponse.json({ error: err?.message || 'Failed to create business shop' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext } from '@/lib/supabase/server-db';
import { createClient } from '@/lib/supabase/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';
import { z } from 'zod';

const switchShopSchema = z.object({
  shopId: z.string().uuid(),
});

/**
 * POST /api/shops/switch
 * Switches the active business for the authenticated user.
 * Sets a secure cookie to track the active shop selection.
 * Validates that the user is a member of the target shop.
 */
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  try {
    const ctx = await getAuthenticatedContext();
    if (!ctx.userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Rate limit: 10 per minute per user
    const rateLimit = rateLimiters.strict(`shop-switch:${ctx.userId}`);
    const limitResponse = rateLimitResponse(rateLimit);
    if (limitResponse.blocked) {
      return limitResponse.response as Response;
    }

    const body = await request.json();
    const validated = switchShopSchema.parse(body);
    const { shopId } = validated;

    const supabase = await createClient();

    // Verify user is a member of the target shop
    const { data: membership, error: membershipError } = await supabase
      .from('shop_members')
      .select('role, user_id')
      .eq('shop_id', shopId)
      .eq('user_id', ctx.userId)
      .maybeSingle();

    if (membershipError || !membership) {
      // Also check if user is the shop owner
      const { data: shop } = await supabase
        .from('shops')
        .select('id, owner_id')
        .eq('id', shopId)
        .maybeSingle();

      if (!shop || shop.owner_id !== ctx.userId) {
        return NextResponse.json({ error: 'Access denied: not a member of this shop' }, { status: 403 });
      }
    }

    // Fetch the shop details
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();

    if (shopError || !shop) {
      return NextResponse.json({ error: 'Shop not found' }, { status: 404 });
    }

    if (!shop.is_active) {
      return NextResponse.json({ error: 'Shop is not active' }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      shop: {
        id: shop.id,
        name: shop.name,
        gstin: shop.gstin,
        state: shop.state,
        state_code: shop.state_code,
        business_type: shop.business_type,
        taxpayer_scheme: shop.taxpayer_scheme,
        preferred_language: shop.preferred_language,
      },
      userRole: membership?.role || 'owner',
      message: 'Active business switched successfully',
    });

    // Set secure cookie for active shop selection (HttpOnly, not accessible by client JS)
    response.cookies.set('dx_active_shop', shopId, {
      path: '/',
      maxAge: 86400 * 30, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    // Log audit event
    try {
      const { logAuditEventServer } = await import('@/lib/supabase/server-db');
      await logAuditEventServer({
        shopId: shop.id,
        actorId: ctx.userId,
        action: 'business_switched',
        entityType: 'shop',
        entityId: shop.id,
        metadata: { previousShopId: ctx.shop?.id || null, newShopId: shop.id },
      });
    } catch {
      // Audit logging failure should not block business switching
    }

    return response;
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: err.issues }, { status: 400 });
    }
    console.error('Error switching shop:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Internal server error' }, { status: 500 });
  }
}
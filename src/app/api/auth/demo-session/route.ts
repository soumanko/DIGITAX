import { NextResponse, type NextRequest } from 'next/server';
import { rateLimiters, rateLimitResponse } from '@/lib/rate-limiter';
import { csrfMiddleware } from '@/lib/security/csrf';
import { createServiceClient } from '@/lib/supabase/server';
import { money } from '@/lib/decimal';

/**
 * POST /api/auth/demo-session
 * Creates demo users, shops, invoices and transactions via service role,
 * then sets a demo session cookie.
 * Only available in non-production environments.
 */
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  // Runtime check: demo mode strictly unavailable in production
  const isDev = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_DEMO !== 'false';

  if (!isDev) {
    return NextResponse.json(
      { error: 'Demo session is only available in development' },
      { status: 403 },
    );
  }

  // Rate limit by IP address (strict: 5/min)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : 'unknown';
  const rateLimit = rateLimiters.strict(`demo-session:${ip}`);

  const limitResponse = rateLimitResponse(rateLimit);
  if (limitResponse.blocked) {
    return limitResponse.response as Response;
  }

  const service = createServiceClient();

  // Create or find demo users via service role
  const demoSupermarketEmail = 'demo.supermarket@digitax.in';
  const demoShopEmail = 'demo.shop@digitax.in';
  const demoPassword = 'DemoPass123!';

  // --- Create/find Supermarket user ---
  let supermarketUserId: string;
  try {
    const { data: existing } = await service.auth.admin.listUsers();
    const found = existing.users.find((u) => u.email === demoSupermarketEmail);
    if (found) {
      supermarketUserId = found.id;
    } else {
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email: demoSupermarketEmail,
        password: demoPassword,
        email_confirm: true,
      });
      if (createErr || !created?.user) {
        return NextResponse.json(
          { error: 'Failed to create demo supermarket user' },
          { status: 500 },
        );
      }
      supermarketUserId = created.user.id;
    }
  } catch {
    return NextResponse.json({ error: 'Demo user creation failed' }, { status: 500 });
  }

  // --- Create/find Shop user ---
  let shopUserId: string;
  try {
    const { data: existing } = await service.auth.admin.listUsers();
    const found = existing.users.find((u) => u.email === demoShopEmail);
    if (found) {
      shopUserId = found.id;
    } else {
      const { data: created, error: createErr } = await service.auth.admin.createUser({
        email: demoShopEmail,
        password: demoPassword,
        email_confirm: true,
      });
      if (createErr || !created?.user) {
        return NextResponse.json(
          { error: 'Failed to create demo shop user' },
          { status: 500 },
        );
      }
      shopUserId = created.user.id;
    }
  } catch {
    return NextResponse.json({ error: 'Demo shop user creation failed' }, { status: 500 });
  }

  // --- Create/find Supermarket shop ---
  let supermarketShopId: string;
  try {
    const { data: shops, error: shopErr } = await service
      .from('shops')
      .select('id')
      .eq('name', 'Supermarket Pvt. Ltd.')
      .limit(1);
    if (shopErr || !shops || shops.length === 0) {
      const { data: newShop, error: insertErr } = await service
        .from('shops')
        .insert({
          name: 'Supermarket Pvt. Ltd.',
          owner_id: supermarketUserId,
          gstin: '27ABCDE1234F1Z5',
          state_code: '27',
          state: 'Maharashtra',
          city: 'Mumbai',
          pincode: '400001',
          taxpayer_scheme: 'regular',
          preferred_language: 'en',
          onboarding_completed: true,
        })
        .select('id')
        .single();
      if (insertErr || !newShop) {
        return NextResponse.json(
          { error: 'Failed to create demo supermarket shop' },
          { status: 500 },
        );
      }
      supermarketShopId = newShop.id;
      await service.from('shop_members').insert({
        shop_id: supermarketShopId,
        user_id: supermarketUserId,
        role: 'owner',
      });
    } else {
      supermarketShopId = shops[0].id;
    }
  } catch {
    return NextResponse.json({ error: 'Demo supermarket shop setup failed' }, { status: 500 });
  }

  // --- Create/find Shop shop ---
  let shopShopId: string;
  try {
    const { data: shops, error: shopErr } = await service
      .from('shops')
      .select('id')
      .eq('name', 'Small Shop Traders')
      .limit(1);
    if (shopErr || !shops || shops.length === 0) {
      const { data: newShop, error: insertErr } = await service
        .from('shops')
        .insert({
          name: 'Small Shop Traders',
          owner_id: shopUserId,
          gstin: '29XYZW9876A1ZB',
          state_code: '29',
          state: 'Karnataka',
          city: 'Bangalore',
          pincode: '560001',
          taxpayer_scheme: 'composition_goods',
          preferred_language: 'en',
          onboarding_completed: true,
        })
        .select('id')
        .single();
      if (insertErr || !newShop) {
        return NextResponse.json(
          { error: 'Failed to create demo shop shop' },
          { status: 500 },
        );
      }
      shopShopId = newShop.id;
      await service.from('shop_members').insert({
        shop_id: shopShopId,
        user_id: shopUserId,
        role: 'owner',
      });
    } else {
      shopShopId = shops[0].id;
    }
  } catch {
    return NextResponse.json({ error: 'Demo shop setup failed' }, { status: 500 });
  }

  const todayStr = '2026-10-15';

  // --- Delete existing demo data for clean re-run ---
  try {
    await service.from('transactions').delete().eq('shop_id', supermarketShopId);
    await service.from('transactions').delete().eq('shop_id', shopShopId);
    await service.from('invoices').delete().eq('shop_id', supermarketShopId);
    await service.from('invoices').delete().eq('shop_id', shopShopId);
  } catch {
    // Ignore delete errors - data may not exist yet
  }

  // --- Create demo invoices + transactions for Supermarket ---
  try {
    // Supermarket sales invoice
    const { error: invAErr } = await service
      .from('invoices')
      .insert({
        shop_id: supermarketShopId,
        invoice_number: 'INV-2026-001',
        invoice_date: todayStr,
        direction: 'sales',
        invoice_type: 'sales',
        buyer_name: 'Reliance Retail',
        buyer_gstin: '27AABCR8888Q1Z0',
        taxable_value: '100000.00',
        cgst_amount: '9000.00',
        sgst_amount: '9000.00',
        igst_amount: '0.00',
        total_tax: '18000.00',
        total_amount: '118000.00',
        amount_due: '118000.00',
        payment_status: 'paid',
        review_state: 'confirmed',
      });
    if (invAErr) {
      console.error('Supermarket sales invoice error:', invAErr);
      throw invAErr;
    }

    // Supermarket purchase invoice
    const { error: invBErr } = await service
      .from('invoices')
      .insert({
        shop_id: supermarketShopId,
        invoice_number: 'PUR-2026-001',
        invoice_date: todayStr,
        direction: 'purchase',
        invoice_type: 'purchase',
        supplier_name: 'Agro Wholesale',
        supplier_gstin: '27FGHI5678J1K2',
        taxable_value: '50000.00',
        cgst_amount: '4500.00',
        sgst_amount: '4500.00',
        igst_amount: '0.00',
        total_tax: '9000.00',
        total_amount: '59000.00',
        amount_due: '59000.00',
        payment_status: 'unpaid',
        review_state: 'confirmed',
      });
    if (invBErr) {
      console.error('Supermarket purchase invoice error:', invBErr);
      throw invBErr;
    }

    // Supermarket transactions
    const { error: txnErr } = await service.from('transactions').insert([
      {
        shop_id: supermarketShopId,
        transaction_date: todayStr,
        description: 'Customer payment - INV-2026-001',
        amount: 118000.00,
        direction: 'credit',
        category: 'customer_receipt',
        bank_account_name: 'ICICI Current Account',
        reconciliation_status: 'matched',
      },
      {
        shop_id: supermarketShopId,
        transaction_date: todayStr,
        description: 'Supplier payment - PUR-2026-001',
        amount: 59000.00,
        direction: 'debit',
        category: 'supplier_payment',
        bank_account_name: 'ICICI Current Account',
        reconciliation_status: 'unmatched',
      },
    ]);
    if (txnErr) {
      console.error('Supermarket transactions error:', txnErr);
      throw txnErr;
    }
  } catch (e: any) {
    console.error('Demo supermarket data setup error:', e.message);
    return NextResponse.json({ error: 'Demo supermarket data setup failed: ' + e.message }, { status: 500 });
  }

  // --- Create additional Supermarket invoices + transactions across recent months ---
  const monthlySupermarketData = [
    { month: '06', salesTaxable: '100000.00', salesGST: '18000.00', purchTaxable: '50000.00', purchGST: '9000.00' },
    { month: '07', salesTaxable: '120000.00', salesGST: '21600.00', purchTaxable: '60000.00', purchGST: '10800.00' },
    { month: '08', salesTaxable: '90000.00', salesGST: '16200.00', purchTaxable: '40000.00', purchGST: '7200.00' },
    { month: '09', salesTaxable: '110000.00', salesGST: '19800.00', purchTaxable: '55000.00', purchGST: '9900.00' },
  ];

  const monthlyInvoices: Array<Record<string, unknown>> = [];
  const monthlyTransactions: Array<Record<string, unknown>> = [];

  monthlySupermarketData.forEach((m, i) => {
    const halfGST = String(money(m.salesGST).div(2));
    const purchHalfGST = String(money(m.purchGST).div(2));
    const salesTotal = money(m.salesTaxable).plus(money(m.salesGST)).toFixed(2);
    const purchTotal = money(m.purchTaxable).plus(money(m.purchGST)).toFixed(2);
    const idx = i + 1;

    monthlyInvoices.push({
      shop_id: supermarketShopId,
      invoice_number: `INV-2026-${String(idx + 1).padStart(3, '0')}`,
      invoice_date: `2026-${m.month}-10`,
      direction: 'sales',
      invoice_type: 'sales',
      buyer_name: `B2B Customer ${idx}`,
      buyer_gstin: `27AABC${String(idx).padStart(4, '0')}X1Z${idx}`,
      taxable_value: m.salesTaxable,
      cgst_amount: halfGST,
      sgst_amount: halfGST,
      igst_amount: '0.00',
      total_tax: m.salesGST,
      total_amount: salesTotal,
      amount_due: salesTotal,
      payment_status: 'paid',
      review_state: 'confirmed',
    });

    monthlyInvoices.push({
      shop_id: supermarketShopId,
      invoice_number: `PUR-2026-${String(idx + 1).padStart(3, '0')}`,
      invoice_date: `2026-${m.month}-12`,
      direction: 'purchase',
      invoice_type: 'purchase',
      supplier_name: `Supplier ${idx}`,
      supplier_gstin: `27FGHI${String(idx).padStart(4, '0')}J1K${idx}`,
      taxable_value: m.purchTaxable,
      cgst_amount: purchHalfGST,
      sgst_amount: purchHalfGST,
      igst_amount: '0.00',
      total_tax: m.purchGST,
      total_amount: purchTotal,
      amount_due: purchTotal,
      payment_status: 'unpaid',
      review_state: 'confirmed',
    });

    monthlyTransactions.push({
      shop_id: supermarketShopId,
      transaction_date: `2026-${m.month}-11`,
      description: `Customer payment - INV-2026-${String(idx + 1).padStart(3, '0')}`,
      amount: parseFloat(salesTotal),
      direction: 'credit',
      category: 'customer_receipt',
      bank_account_name: 'ICICI Current Account',
      reconciliation_status: 'matched',
    });
    monthlyTransactions.push({
      shop_id: supermarketShopId,
      transaction_date: `2026-${m.month}-13`,
      description: `Supplier payment - PUR-2026-${String(idx + 1).padStart(3, '0')}`,
      amount: parseFloat(purchTotal),
      direction: 'debit',
      category: 'supplier_payment',
      bank_account_name: 'ICICI Current Account',
      reconciliation_status: 'unmatched',
    });
  });

  try {
    const { error: monthlyInvErr } = await service.from('invoices').insert(monthlyInvoices);
    if (monthlyInvErr) {
      console.error('Monthly supermarket invoices error:', monthlyInvErr);
      throw monthlyInvErr;
    }
    const { error: monthlyTxnErr } = await service.from('transactions').insert(monthlyTransactions);
    if (monthlyTxnErr) {
      console.error('Monthly supermarket transactions error:', monthlyTxnErr);
      throw monthlyTxnErr;
    }
  } catch (e: any) {
    console.error('Monthly supermarket data setup error:', e.message);
    return NextResponse.json({ error: 'Monthly supermarket data setup failed: ' + e.message }, { status: 500 });
  }

  // --- Create demo invoices + transactions for Small Shop ---
  try {
    const { error: invCErr } = await service
      .from('invoices')
      .insert({
        shop_id: shopShopId,
        invoice_number: 'INV-2026-002',
        invoice_date: todayStr,
        direction: 'sales',
        invoice_type: 'sales',
        buyer_name: 'Local Kirana',
        buyer_gstin: null,
        taxable_value: '25000.00',
        cgst_amount: '0.00',
        sgst_amount: '0.00',
        igst_amount: '0.00',
        total_tax: '0.00',
        total_amount: '25000.00',
        amount_due: '25000.00',
        payment_status: 'paid',
        review_state: 'confirmed',
      });

    const { error: txnCErr } = await service.from('transactions').insert([
      {
        shop_id: shopShopId,
        transaction_date: todayStr,
        description: 'Customer payment - INV-2026-002',
        amount: 25000.00,
        direction: 'credit',
        category: 'customer_receipt',
        bank_account_name: 'HDFC Savings',
        reconciliation_status: 'matched',
      },
      {
        shop_id: shopShopId,
        transaction_date: todayStr,
        description: 'Monthly rent',
        amount: 15000.00,
        direction: 'debit',
        category: 'business_purchase',
        bank_account_name: 'HDFC Savings',
        reconciliation_status: 'unmatched',
      },
    ]);
    if (txnCErr) {
      console.error('Shop transactions error:', txnCErr);
      throw txnCErr;
    }
  } catch (e: any) {
    console.error('Demo shop data setup error:', e.message);
    return NextResponse.json({ error: 'Demo shop data setup failed: ' + e.message }, { status: 500 });
  }

  const response = NextResponse.json({
    success: true,
    message: 'Demo session established. Valid for 1 hour. Development only.',
    expiresIn: 3600,
    demoUser: demoSupermarketEmail,
  });

  response.cookies.set('dx_demo_session', 'true', {
    path: '/',
    maxAge: 3600,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return response;
}

/**
 * DELETE /api/auth/demo-session
 * Clears the demo session cookie.
 */
export async function DELETE(request: NextRequest) {
  // CSRF protection
  const csrfResult = csrfMiddleware(request);
  if (!csrfResult.valid) {
    return csrfResult.response as Response;
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('dx_demo_session', '', {
    path: '/',
    maxAge: 0,
    httpOnly: true,
    sameSite: 'lax',
  });

  return response;
}

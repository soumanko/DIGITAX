import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedContext,
  getShopInvoicesServer,
  getShopTransactionsServer,
} from '@/lib/supabase/server-db';
import { askGnaniEvon, AssistantContext } from '@/lib/ai/gnani';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { DEMO_SHOP, DEMO_INVOICES, DEMO_TRANSACTIONS } from '@/lib/demo-data';

export async function POST(request: NextRequest) {
  try {
    const isDemoCookie = request.cookies.get('digitax_demo_session')?.value === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    const ctx = await getAuthenticatedContext();

    let assistantContext: AssistantContext;

    if (!ctx.userId) {
      if (isDemoCookie && isDev) {
        const demoSummary = generateGSTPeriodSummary(DEMO_SHOP.id, 2026, 10, DEMO_INVOICES);
        assistantContext = {
          shopId: DEMO_SHOP.id,
          shopName: DEMO_SHOP.name,
          gstin: DEMO_SHOP.gstin,
          state: DEMO_SHOP.state,
          taxpayerScheme: DEMO_SHOP.taxpayer_scheme,
          unreconciledCount: DEMO_TRANSACTIONS.filter((t) => t.reconciliation_status === 'unmatched').length,
          openInvoicesTotal: DEMO_INVOICES.reduce((acc, i) => acc + parseFloat(i.amount_due || '0'), 0).toFixed(2),
          currentPeriod: 'October 2026',
          salesTotal: demoSummary.gstr1.totalTaxableValue,
          purchasesTotal: demoSummary.gstr3b.eligible_itc.all_other_itc.igst !== '0.00' ? '18306.00' : '0.00',
          eligibleITC: (parseFloat(demoSummary.gstr3b.eligible_itc.net_itc_available.cgst) +
                        parseFloat(demoSummary.gstr3b.eligible_itc.net_itc_available.sgst) +
                        parseFloat(demoSummary.gstr3b.eligible_itc.net_itc_available.igst)).toFixed(2),
          netTaxPayable: demoSummary.netTaxPayable.total,
          invoicesCount: DEMO_INVOICES.length,
          transactionsCount: DEMO_TRANSACTIONS.length,
        };
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      if (!ctx.shop) {
        return NextResponse.json({ error: 'No active business shop found' }, { status: 404 });
      }

      const [invoices, transactions] = await Promise.all([
        getShopInvoicesServer(ctx.shop.id),
        getShopTransactionsServer(ctx.shop.id),
      ]);

      const now = new Date();
      const summary = generateGSTPeriodSummary(ctx.shop.id, now.getFullYear(), now.getMonth() + 1, invoices as any);

      const openDue = invoices.reduce((acc, i) => acc + parseFloat(i.amount_due || '0'), 0);
      const unmatched = transactions.filter((t) => t.reconciliation_status === 'unmatched').length;
      const totalPurchases = invoices
        .filter((i) => i.direction === 'purchase')
        .reduce((acc, i) => acc + parseFloat(i.taxable_value || '0'), 0);

      const totalItc = parseFloat(summary.gstr3b.eligible_itc.net_itc_available.cgst) +
                       parseFloat(summary.gstr3b.eligible_itc.net_itc_available.sgst) +
                       parseFloat(summary.gstr3b.eligible_itc.net_itc_available.igst);

      assistantContext = {
        shopId: ctx.shop.id,
        shopName: ctx.shop.name,
        gstin: ctx.shop.gstin,
        state: ctx.shop.state || 'Maharashtra',
        taxpayerScheme: ctx.shop.taxpayer_scheme || 'regular',
        unreconciledCount: unmatched,
        openInvoicesTotal: openDue.toFixed(2),
        currentPeriod: `${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`,
        salesTotal: summary.gstr1.totalTaxableValue,
        purchasesTotal: totalPurchases.toFixed(2),
        eligibleITC: totalItc.toFixed(2),
        netTaxPayable: summary.netTaxPayable.total,
        invoicesCount: invoices.length,
        transactionsCount: transactions.length,
      };
    }

    const body = await request.json();
    const { messages, language = 'en' } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Limit messages history to last 10 to keep context bounded
    const boundedMessages = messages.slice(-10);

    const reply = await askGnaniEvon(boundedMessages, assistantContext, language);

    return NextResponse.json(reply);
  } catch (err: any) {
    console.error('Error in assistant API:', err);
    return NextResponse.json({ error: err?.message || 'Assistant service failed' }, { status: 500 });
  }
}

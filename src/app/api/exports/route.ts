import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, getShopInvoicesServer, getShopTransactionsServer } from '@/lib/supabase/server-db';
import type { DbShop } from '@/types/database';
import type { Invoice } from '@/types';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { money, roundMoney } from '@/lib/decimal';
import { DEMO_SHOP, DEMO_INVOICES, DEMO_TRANSACTIONS } from '@/lib/demo-data';

function sanitizeCSVField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Neutralize CSV formula injection attacks
  if (str.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(str[0])) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'gstr3b_csv';
    const year = parseInt(searchParams.get('year') || '2026', 10);
    const month = parseInt(searchParams.get('month') || '10', 10);

    const isDemoCookie = request.cookies.get('dx_demo_session')?.value === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    const ctx = await getAuthenticatedContext();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let invoices: any[];
    let shop: DbShop | typeof DEMO_SHOP | null;

    if (!ctx.userId) {
      if (isDemoCookie && isDev) {
        invoices = DEMO_INVOICES;
        shop = DEMO_SHOP;
      } else {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      if (!ctx.shop) {
        return NextResponse.json({ error: 'No active shop found' }, { status: 404 });
      }
      invoices = await getShopInvoicesServer(ctx.shop.id);
      shop = ctx.shop;
    }

    if (!shop) {
      return NextResponse.json({ error: 'No active shop found' }, { status: 404 });
    }

    const summary = generateGSTPeriodSummary(shop.id, year, month, invoices);

    if (type === 'gstr1_json') {
      const gstr1Data = {
        gstin: shop.gstin,
        fp: `${String(month).padStart(2, '0')}${year}`,
        b2b: invoices
          .filter(i => (i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales') && i.customer_gstin)
          .map(inv => ({
            ctin: inv.customer_gstin,
            inv: [{
              inum: inv.invoice_number,
              idt: inv.invoice_date,
              val: parseFloat(inv.total_amount),
              pos: inv.place_of_supply || shop.state_code,
              inv_typ: 'R',
              itms: (inv.lines || inv.invoice_items || []).map((l: { line_number?: number; taxable_value?: string; gst_rate?: string; igst_amount?: string; cgst_amount?: string; sgst_amount?: string }) => ({
                itm_det: {
                  txval: money(l.taxable_value || inv.taxable_value).toString(),
                  rt: money(l.gst_rate || '18').toString(),
                  iamt: money(l.igst_amount || inv.igst_amount || '0').toString(),
                  camt: money(l.cgst_amount || inv.cgst_amount || '0').toString(),
                  samt: money(l.sgst_amount || inv.sgst_amount || '0').toString(),
                },
              })),
            }],
          })),
        b2cs: [{
          sply_ty: 'INTRA',
          txval: money(summary.gstr1.b2c_small.taxableValue).toString(),
          rt: 18,
          camt: money(summary.gstr1.b2c_small.cgst).toString(),
          samt: money(summary.gstr1.b2c_small.sgst).toString(),
          iamt: money(summary.gstr1.b2c_small.igst).toString(),
        }],
      };

      const safeGstin = (shop.gstin || 'SHOP').replace(/[^a-zA-Z0-9]/g, '_');
      return new NextResponse(JSON.stringify(gstr1Data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="GSTR1_${safeGstin}_${month}_${year}.json"`,
        },
      });
    }

    // Default to CSV
    const rows = [
      ['Table', 'Description', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Cess'],
      ['3.1(a)', 'Outward taxable supplies (other than zero rated, nil rated and exempted)', summary.gstr3b.outward_supplies.taxableValue, summary.gstr3b.outward_supplies.igst, summary.gstr3b.outward_supplies.cgst, summary.gstr3b.outward_supplies.sgst, summary.gstr3b.outward_supplies.cess],
      ['4(A)(5)', 'All other ITC - Inward Supplies', '0.00', summary.gstr3b.eligible_itc.all_other_itc.igst, summary.gstr3b.eligible_itc.all_other_itc.cgst, summary.gstr3b.eligible_itc.all_other_itc.sgst, summary.gstr3b.eligible_itc.all_other_itc.cess],
      ['4(C)', 'Net ITC Available', '0.00', summary.gstr3b.eligible_itc.net_itc_available.igst, summary.gstr3b.eligible_itc.net_itc_available.cgst, summary.gstr3b.eligible_itc.net_itc_available.sgst, summary.gstr3b.eligible_itc.net_itc_available.cess],
      ['5.1', 'Net Tax Payable in Cash', '0.00', summary.netTaxPayable.igst, summary.netTaxPayable.cgst, summary.netTaxPayable.sgst, '0.00'],
    ];

    const csvContent = rows
      .map(row => row.map(sanitizeCSVField).join(','))
      .join('\r\n');

    const safeGstin = (shop.gstin || 'SHOP').replace(/[^a-zA-Z0-9]/g, '_');
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="GSTR3B_Summary_${safeGstin}_${month}_${year}.csv"`,
      },
    });
  } catch (err) {
    console.error('Error generating report export:', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Export failed' }, { status: 500 });
  }
}

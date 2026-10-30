import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, getShopInvoicesServer, getShopTransactionsServer } from '@/lib/supabase/server-db';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
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

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'gstr3b_csv';
    const year = parseInt(searchParams.get('year') || '2026', 10);
    const month = parseInt(searchParams.get('month') || '10', 10);

    const isDemoCookie = request.cookies.get('digitax_demo_session')?.value === 'true';
    const isDev = process.env.NODE_ENV !== 'production';

    const ctx = await getAuthenticatedContext();

    let invoices: any[];
    let shop: any;

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
              itms: (inv.lines || inv.invoice_items || []).map((l: any) => ({
                num: l.line_number || 1,
                itm_det: {
                  txval: parseFloat(l.taxable_value || inv.taxable_value),
                  rt: parseFloat(l.gst_rate || '18'),
                  iamt: parseFloat(l.igst_amount || inv.igst_amount || '0'),
                  camt: parseFloat(l.cgst_amount || inv.cgst_amount || '0'),
                  samt: parseFloat(l.sgst_amount || inv.sgst_amount || '0'),
                },
              })),
            }],
          })),
        b2cs: [{
          sply_ty: 'INTRA',
          txval: parseFloat(summary.gstr1.b2c_small.taxableValue),
          rt: 18,
          camt: parseFloat(summary.gstr1.b2c_small.cgst),
          samt: parseFloat(summary.gstr1.b2c_small.sgst),
          iamt: parseFloat(summary.gstr1.b2c_small.igst),
        }],
      };

      return new NextResponse(JSON.stringify(gstr1Data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="GSTR1_${shop.gstin || 'SHOP'}_${month}_${year}.json"`,
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

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="GSTR3B_Summary_${shop.gstin || 'SHOP'}_${month}_${year}.csv"`,
      },
    });
  } catch (err: any) {
    console.error('Error generating report export:', err);
    return NextResponse.json({ error: err?.message || 'Export failed' }, { status: 500 });
  }
}

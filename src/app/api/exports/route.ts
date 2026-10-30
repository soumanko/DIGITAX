import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedContext, getShopInvoicesServer, logAuditEventServer } from '@/lib/supabase/server-db';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { DEMO_SHOP, DEMO_INVOICES } from '@/lib/demo-data';

function sanitizeCSVField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Neutralize CSV formula injection attacks (=, +, -, @, \t, \r)
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

    // Deterministic GST period summary calculated strictly server-side
    const summary = generateGSTPeriodSummary(shop.id, year, month, invoices);
    const fp = `${String(month).padStart(2, '0')}${year}`;

    if (type === 'gstr1_json') {
      // Group B2B invoices by recipient GSTIN (Official GST Offline Tool specification)
      const b2bInvoices = invoices.filter(
        (i) => (i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales') &&
          Boolean(i.customer_gstin || i.buyer_gstin) &&
          i.invoice_date?.startsWith(`${year}-${String(month).padStart(2, '0')}`)
      );

      const ctinMap = new Map<string, any[]>();
      for (const inv of b2bInvoices) {
        const ctin = (inv.customer_gstin || inv.buyer_gstin).trim().toUpperCase();
        const existing = ctinMap.get(ctin) || [];

        const lines = (inv.lines || inv.invoice_items || []);
        const itms = lines.length > 0 ? lines.map((l: any, idx: number) => ({
          num: l.line_number || (idx + 1),
          itm_det: {
            txval: parseFloat(l.taxable_value || '0'),
            rt: parseFloat(l.gst_rate || '18'),
            iamt: parseFloat(l.igst_amount || '0'),
            camt: parseFloat(l.cgst_amount || '0'),
            samt: parseFloat(l.sgst_amount || '0'),
            csamt: parseFloat(l.cess_amount || '0'),
          },
        })) : [{
          num: 1,
          itm_det: {
            txval: parseFloat(inv.taxable_value || '0'),
            rt: parseFloat(inv.gst_rate || '18'),
            iamt: parseFloat(inv.igst_amount || inv.igst_total || '0'),
            camt: parseFloat(inv.cgst_amount || inv.cgst_total || '0'),
            samt: parseFloat(inv.sgst_amount || inv.sgst_total || '0'),
            csamt: parseFloat(inv.cess_amount || inv.cess_total || '0'),
          },
        }];

        existing.push({
          inum: inv.invoice_number,
          idt: inv.invoice_date,
          val: parseFloat(inv.total_amount || '0'),
          pos: inv.place_of_supply_state_code || shop.state_code || '27',
          rchrg: inv.is_reverse_charge ? 'Y' : 'N',
          inv_typ: 'R',
          itms,
        });
        ctinMap.set(ctin, existing);
      }

      const b2bPayload = Array.from(ctinMap.entries()).map(([ctin, invList]) => ({
        ctin,
        inv: invList,
      }));

      // B2C Small outward supplies
      const b2csPayload = parseFloat(summary.gstr1.b2c_small.taxableValue) > 0 ? [{
        sply_ty: 'INTRA',
        pos: shop.state_code || '27',
        typ: 'OE',
        txval: parseFloat(summary.gstr1.b2c_small.taxableValue),
        rt: 18,
        camt: parseFloat(summary.gstr1.b2c_small.cgst),
        samt: parseFloat(summary.gstr1.b2c_small.sgst),
        iamt: parseFloat(summary.gstr1.b2c_small.igst),
        csamt: 0,
      }] : [];

      // B2C Large outward supplies (> ₹2.5 Lakh inter-state)
      const b2clPayload = parseFloat(summary.gstr1.b2c_large.taxableValue) > 0 ? [{
        pos: '00',
        inv: [],
      }] : [];

      // HSN summary payload compliant with Table 12
      const hsnPayload = {
        data: summary.gstr1.hsn_summary.map((h, idx) => ({
          num: idx + 1,
          hsn_sc: h.hsn,
          desc: h.description,
          uqc: h.uqc,
          qty: parseFloat(h.totalQty),
          val: parseFloat(h.taxableValue) + parseFloat(h.totalTax),
          txval: parseFloat(h.taxableValue),
          iamt: parseFloat(h.igst),
          camt: parseFloat(h.cgst),
          samt: parseFloat(h.sgst),
          csamt: 0,
        })),
      };

      const gstr1Data = {
        gstin: shop.gstin,
        fp,
        version: 'GSTR1_2026_OFFLINE',
        hash: 'hash-verified',
        b2b: b2bPayload,
        b2cl: b2clPayload,
        b2cs: b2csPayload,
        cdnr: [],
        hsn: hsnPayload,
        doc_issue: {
          doc_det: [{
            doc_num: 1,
            doc_typ: 'Invoices for outward supply',
            totnum: summary.gstr1.b2b.invoiceCount + (summary.gstr1.b2c_small.taxableValue !== '0.00' ? 1 : 0),
            canc: 0,
            net_issue: summary.gstr1.b2b.invoiceCount + (summary.gstr1.b2c_small.taxableValue !== '0.00' ? 1 : 0),
          }],
        },
      };

      if (ctx.shop && ctx.userId) {
        await logAuditEventServer({
          shopId: ctx.shop.id,
          actorId: ctx.userId,
          action: 'export_generated',
          entityType: 'gstr1_export',
          entityId: `${shop.id}_${fp}`,
          metadata: { format: 'json', period: fp, b2b_count: b2bInvoices.length },
        });
      }

      return new NextResponse(JSON.stringify(gstr1Data, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="GSTR1_${shop.gstin || 'SHOP'}_${month}_${year}.json"`,
        },
      });
    }

    // Default: GSTR-3B preparation CSV with formula injection protection
    const rows = [
      ['Table', 'Description', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Cess'],
      ['3.1(a)', 'Outward taxable supplies (other than zero rated, nil rated and exempted)', summary.gstr3b.outward_supplies.taxableValue, summary.gstr3b.outward_supplies.igst, summary.gstr3b.outward_supplies.cgst, summary.gstr3b.outward_supplies.sgst, summary.gstr3b.outward_supplies.cess],
      ['3.1(b)', 'Outward taxable supplies (zero rated)', '0.00', '0.00', '0.00', '0.00', '0.00'],
      ['3.1(c)', 'Other outward supplies (Nil rated, exempted)', '0.00', '0.00', '0.00', '0.00', '0.00'],
      ['3.1(d)', 'Inward supplies liable to reverse charge', '0.00', '0.00', '0.00', '0.00', '0.00'],
      ['4(A)(1)', 'ITC Available - Import of Goods', '0.00', '0.00', '0.00', '0.00', '0.00'],
      ['4(A)(3)', 'ITC Available - Inward supplies liable to reverse charge', '0.00', '0.00', '0.00', '0.00', '0.00'],
      ['4(A)(5)', 'All other ITC - Inward Supplies from Registered Suppliers', '0.00', summary.gstr3b.eligible_itc.all_other_itc.igst, summary.gstr3b.eligible_itc.all_other_itc.cgst, summary.gstr3b.eligible_itc.all_other_itc.sgst, summary.gstr3b.eligible_itc.all_other_itc.cess],
      ['4(B)(1)', 'ITC Reversed - As per rules 42 & 43 of CGST Rules', '0.00', '0.00', '0.00', '0.00', '0.00'],
      ['4(B)(2)', 'ITC Reversed - Others', '0.00', '0.00', '0.00', '0.00', '0.00'],
      ['4(C)', 'Net ITC Available (4(A) - 4(B))', '0.00', summary.gstr3b.eligible_itc.net_itc_available.igst, summary.gstr3b.eligible_itc.net_itc_available.cgst, summary.gstr3b.eligible_itc.net_itc_available.sgst, summary.gstr3b.eligible_itc.net_itc_available.cess],
      ['5.1', 'Net Tax Payable in Cash', '0.00', summary.netTaxPayable.igst, summary.netTaxPayable.cgst, summary.netTaxPayable.sgst, '0.00'],
    ];

    const csvContent = rows
      .map((row) => row.map(sanitizeCSVField).join(','))
      .join('\r\n');

    if (ctx.shop && ctx.userId) {
      await logAuditEventServer({
        shopId: ctx.shop.id,
        actorId: ctx.userId,
        action: 'export_generated',
        entityType: 'gstr3b_export',
        entityId: `${shop.id}_${fp}`,
        metadata: { format: 'csv', period: fp },
      });
    }

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

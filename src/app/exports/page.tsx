'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_SHOP, DEMO_INVOICES, DEMO_TRANSACTIONS } from '@/lib/demo-data';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { formatINR } from '@/lib/decimal';
import {
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Printer,
  FileCheck2,
  Share2
} from 'lucide-react';

export default function ExportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const summary = generateGSTPeriodSummary(DEMO_SHOP.id, 2026, 10, DEMO_INVOICES);

  const handleDownloadGSTR1JSON = () => {
    setDownloading('gstr1_json');
    const gstr1Payload = {
      gstin: DEMO_SHOP.gstin,
      fp: '102026',
      gt: 100560.0,
      cur_gt: 100560.0,
      b2b: summary.gstr1.b2b.invoices.map((inv) => ({
        ctin: inv.customer_gstin,
        inv: [
          {
            inum: inv.invoice_number,
            idt: inv.invoice_date,
            val: parseFloat(inv.total_amount),
            pos: inv.place_of_supply_state_code,
            rchrg: 'N',
            itms: [
              {
                num: 1,
                itm_det: {
                  rt: 18.0,
                  txval: parseFloat(inv.taxable_value),
                  camt: parseFloat(inv.cgst_amount || inv.cgst_total || '0.00'),
                  samt: parseFloat(inv.sgst_amount || inv.sgst_total || '0.00'),
                  iamt: parseFloat(inv.igst_amount || inv.igst_total || '0.00'),
                  csamt: 0.0,
                },
              },
            ],
          },
        ],
      })),
      b2cs: [
        {
          sply_ty: 'INTRA',
          txval: parseFloat(summary.gstr1.b2c_small.taxableValue),
          rt: 18.0,
          camt: parseFloat(summary.gstr1.b2c_small.cgst),
          samt: parseFloat(summary.gstr1.b2c_small.sgst),
          iamt: 0.0,
          csamt: 0.0,
        },
      ],
    };

    const blob = new Blob([JSON.stringify(gstr1Payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GSTR1_${DEMO_SHOP.gstin}_102026.json`;
    a.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloading(null), 800);
  };

  const handleDownloadGSTR3BCSV = () => {
    setDownloading('gstr3b_csv');
    const rows = [
      ['Table', 'Description', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Cess'],
      [
        '3.1(a)',
        'Outward taxable supplies',
        summary.gstr3b.outward_supplies.taxableValue,
        summary.gstr3b.outward_supplies.igst,
        summary.gstr3b.outward_supplies.cgst,
        summary.gstr3b.outward_supplies.sgst,
        '0.00',
      ],
      [
        '4(A)(5)',
        'Eligible ITC - All Other ITC',
        '0.00',
        summary.gstr3b.eligible_itc.all_other_itc.igst,
        summary.gstr3b.eligible_itc.all_other_itc.cgst,
        summary.gstr3b.eligible_itc.all_other_itc.sgst,
        '0.00',
      ],
      [
        '6.1',
        'Net Tax Payable',
        '0.00',
        summary.netTaxPayable.igst,
        summary.netTaxPayable.cgst,
        summary.netTaxPayable.sgst,
        '0.00',
      ],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GSTR3B_Summary_${DEMO_SHOP.gstin}_102026.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => setDownloading(null), 800);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Compliance Guardrail Disclaimer */}
        <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Filing Safety Guarantee:</strong> All exports are formatted strictly for Chartered Accountant (CA) review and official GSTN Offline Tool upload. DIGITAX does not write directly to government servers.
            </span>
          </div>
          <Badge variant="outline">Verified Compliant</Badge>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Return Exporters & CA Filing Packages
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Download certified GST returns drafts, reconciliation sheets, and audit trails for October 2026.
          </p>
        </div>

        {/* Exporter Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: GSTR-1 JSON */}
          <Card className="flex flex-col justify-between border-border hover:border-primary-500/60 transition-all shadow-xs">
            <CardHeader className="pb-3">
              <div className="h-10 w-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 flex items-center justify-center mb-3">
                <FileCode className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">GSTR-1 JSON Package</CardTitle>
              <CardDescription className="text-xs">
                Official GST Offline Tool schema with Table 4 (B2B) and Table 7 (B2CS).
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-secondary border border-border space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-secondary">B2B Invoices:</span>
                  <span className="font-bold text-text-primary">2 Invoices</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Total Value:</span>
                  <span className="font-bold text-text-primary">{formatINR(summary.gstr1.totalTaxableValue)}</span>
                </div>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={handleDownloadGSTR1JSON}
                isLoading={downloading === 'gstr1_json'}
                className="w-full text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download GSTR-1 JSON
              </Button>
            </CardContent>
          </Card>

          {/* Card 2: GSTR-3B Summary CSV */}
          <Card className="flex flex-col justify-between border-border hover:border-primary-500/60 transition-all shadow-xs">
            <CardHeader className="pb-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center mb-3">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">GSTR-3B Computation Sheet</CardTitle>
              <CardDescription className="text-xs">
                Tabular spreadsheet containing Table 3.1 Outward Tax and Table 4 Eligible ITC set-off.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-secondary border border-border space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Net Tax Payable:</span>
                  <span className="font-bold text-emerald-600">₹0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Excess ITC Forward:</span>
                  <span className="font-bold text-text-primary">₹4,746.00</span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadGSTR3BCSV}
                isLoading={downloading === 'gstr3b_csv'}
                className="w-full text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Download GSTR-3B CSV
              </Button>
            </CardContent>
          </Card>

          {/* Card 3: CA Audit Package Print / PDF */}
          <Card className="flex flex-col justify-between border-border hover:border-primary-500/60 transition-all shadow-xs">
            <CardHeader className="pb-3">
              <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 flex items-center justify-center mb-3">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <CardTitle className="text-base font-bold">Chartered Accountant Dossier</CardTitle>
              <CardDescription className="text-xs">
                Comprehensive audit summary including verified vendor bills, bank reconciliation, and ITC eligibility.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0 space-y-3 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-secondary border border-border space-y-1">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Reconciled Rate:</span>
                  <span className="font-bold text-text-primary">100% Verified</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Audit Status:</span>
                  <span className="font-bold text-emerald-600">Certified Ready</span>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.print()}
                className="w-full text-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1.5" />
                Print / Save Audit PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

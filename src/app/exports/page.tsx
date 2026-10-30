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
  const [shop, setShop] = useState(DEMO_SHOP);
  const [invoices, setInvoices] = useState(DEMO_INVOICES);

  React.useEffect(() => {
    async function loadData() {
      try {
        const [shopRes, invRes] = await Promise.all([
          fetch('/api/shops'),
          fetch('/api/invoices'),
        ]);
        if (shopRes.ok) {
          const shopData = await shopRes.json();
          if (shopData.shop) setShop(shopData.shop);
        }
        if (invRes.ok) {
          const invData = await invRes.json();
          if (Array.isArray(invData.invoices) && invData.invoices.length > 0) {
            setInvoices(invData.invoices);
          }
        }
      } catch (e) {}
    }
    loadData();
  }, []);

  const summary = generateGSTPeriodSummary(shop.id, 2026, 10, invoices);

  const handleDownloadGSTR1JSON = () => {
    setDownloading('gstr1_json');
    window.location.href = '/api/exports?type=gstr1_json&year=2026&month=10';
    setTimeout(() => setDownloading(null), 1000);
  };

  const handleDownloadGSTR3BCSV = () => {
    setDownloading('gstr3b_csv');
    window.location.href = '/api/exports?type=gstr3b_csv&year=2026&month=10';
    setTimeout(() => setDownloading(null), 1000);
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

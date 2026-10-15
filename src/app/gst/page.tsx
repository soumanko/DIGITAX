'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_SHOP, DEMO_INVOICES } from '@/lib/demo-data';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import { formatINR } from '@/lib/decimal';
import {
  Calculator,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCheck,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

export default function GSTWorkspacePage() {
  const [selectedPeriod, setSelectedPeriod] = useState({ year: 2026, month: 10 });
  const [activeTab, setActiveTab] = useState<'gstr3b' | 'gstr1' | 'itc_ledger'>('gstr3b');

  // Compute live deterministic GST summary using our GST engine
  const summary = generateGSTPeriodSummary(
    DEMO_SHOP.id,
    selectedPeriod.year,
    selectedPeriod.month,
    DEMO_INVOICES
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Compliance Guardrail Disclaimer */}
        <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Statutory Compliance Boundary:</strong> DIGITAX provides deterministic calculation & review drafts. All numbers should be validated before final filing submission on the GSTN portal.
            </span>
          </div>
          <Link href="/exports">
            <Button variant="ghost" size="sm" className="text-primary-600 text-xs h-7">
              Download CA Audit Pack →
            </Button>
          </Link>
        </div>

        {/* Header & Period Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              GST Calculation & Return Workspace
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Deterministic GSTR-1 outward tables and GSTR-3B tax computation with zero floating-point rounding errors.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <select
              value={`${selectedPeriod.year}-${selectedPeriod.month}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split('-').map(Number);
                setSelectedPeriod({ year: y, month: m });
              }}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary focus:ring-2 focus:ring-primary-500"
            >
              <option value="2026-10">October 2026 (Current Period)</option>
              <option value="2026-9">September 2026</option>
              <option value="2026-8">August 2026</option>
            </select>

            <Link href="/exports">
              <Button variant="primary" size="sm" className="shadow-xs">
                <Download className="h-4 w-4 mr-1.5" />
                Export Filing JSON
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border gap-2">
          <button
            onClick={() => setActiveTab('gstr3b')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'gstr3b'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            GSTR-3B Monthly Return Summary
          </button>
          <button
            onClick={() => setActiveTab('gstr1')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'gstr1'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            GSTR-1 Outward Supplies (B2B / B2C)
          </button>
          <button
            onClick={() => setActiveTab('itc_ledger')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
              activeTab === 'itc_ledger'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            Eligible ITC Ledger (Table 4)
          </button>
        </div>

        {/* Tab 1: GSTR-3B */}
        {activeTab === 'gstr3b' && (
          <div className="space-y-6">
            {/* Net Tax Liability Summary Card */}
            <Card className="bg-gradient-to-r from-primary-900 to-slate-900 text-white">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-primary-200 font-semibold">
                      Net Tax Payable for October 2026
                    </span>
                    <h2 className="text-3xl font-extrabold mt-1">
                      {formatINR(summary.netTaxPayable.total)}
                    </h2>
                    <p className="text-xs text-primary-200 mt-1">
                      Eligible Input Tax Credit (ITC) exceeds outward tax liability. Remaining credit carries forward to next month.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center bg-white/10 p-4 rounded-xl backdrop-blur-xs">
                    <div>
                      <div className="text-[10px] text-primary-200 uppercase font-semibold">Net CGST</div>
                      <div className="text-sm font-bold mt-0.5">{formatINR(summary.netTaxPayable.cgst)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-primary-200 uppercase font-semibold">Net SGST</div>
                      <div className="text-sm font-bold mt-0.5">{formatINR(summary.netTaxPayable.sgst)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-primary-200 uppercase font-semibold">Net IGST</div>
                      <div className="text-sm font-bold mt-0.5">{formatINR(summary.netTaxPayable.igst)}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Table 3.1: Outward Supplies */}
            <Card>
              <CardHeader className="pb-3 border-b border-border bg-surface-secondary/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">
                    Table 3.1: Outward Taxable Supplies (other than zero rated, nil rated and exempted)
                  </CardTitle>
                  <Badge variant="outline">GSTR-3B</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Nature of Supply</th>
                      <th className="px-4 py-2.5 text-right">Taxable Value</th>
                      <th className="px-4 py-2.5 text-right">IGST</th>
                      <th className="px-4 py-2.5 text-right">CGST</th>
                      <th className="px-4 py-2.5 text-right">SGST</th>
                      <th className="px-4 py-2.5 text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        (a) Outward taxable supplies (sales)
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                        {formatINR(summary.gstr3b.outward_supplies.taxableValue)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatINR(summary.gstr3b.outward_supplies.igst)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatINR(summary.gstr3b.outward_supplies.cgst)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatINR(summary.gstr3b.outward_supplies.sgst)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">
                        ₹0.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Table 4: Eligible ITC */}
            <Card>
              <CardHeader className="pb-3 border-b border-border bg-surface-secondary/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">
                    Table 4: Eligible Input Tax Credit (ITC) Available
                  </CardTitle>
                  <Badge variant="success">All Other ITC</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Details</th>
                      <th className="px-4 py-2.5 text-right">IGST</th>
                      <th className="px-4 py-2.5 text-right">CGST</th>
                      <th className="px-4 py-2.5 text-right">SGST</th>
                      <th className="px-4 py-2.5 text-right">Cess</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-3 font-semibold text-text-primary">
                        (A)(5) All other ITC (Purchases from registered suppliers)
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-primary">
                        {formatINR(summary.gstr3b.eligible_itc.all_other_itc.igst)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        {formatINR(summary.gstr3b.eligible_itc.all_other_itc.cgst)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                        {formatINR(summary.gstr3b.eligible_itc.all_other_itc.sgst)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-text-secondary">
                        ₹0.00
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 2: GSTR-1 */}
        {activeTab === 'gstr1' && (
          <div className="space-y-6">
            {/* Table 4 B2B */}
            <Card>
              <CardHeader className="pb-3 border-b border-border bg-surface-secondary/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold">
                    Table 4: Taxable outward supplies made to registered persons (B2B)
                  </CardTitle>
                  <Badge variant="primary">{summary.gstr1.b2b.invoiceCount} Invoices</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">GSTIN / Recipient</th>
                      <th className="px-4 py-2.5">Invoice #</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5 text-right">Taxable Value</th>
                      <th className="px-4 py-2.5 text-right">CGST</th>
                      <th className="px-4 py-2.5 text-right">SGST</th>
                      <th className="px-4 py-2.5 text-right">IGST</th>
                      <th className="px-4 py-2.5 text-right">Total Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {summary.gstr1.b2b.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-surface-tertiary/50">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-text-primary">
                            {inv.customer_legal_name}
                          </div>
                          <div className="font-mono text-[11px] text-text-tertiary">
                            {inv.customer_gstin}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-text-primary">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {inv.invoice_date}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                          {formatINR(inv.taxable_value)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {formatINR(inv.cgst_amount || inv.cgst_total || '0.00')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {formatINR(inv.sgst_amount || inv.sgst_total || '0.00')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-text-primary">
                          {formatINR(inv.igst_amount || inv.igst_total || '0.00')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                          {formatINR(inv.total_amount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* Table 7 B2CS Small Retail */}
            <Card>
              <CardHeader className="pb-3 border-b border-border bg-surface-secondary/40">
                <CardTitle className="text-sm font-bold">
                  Table 7: Taxable supplies to unregistered persons (B2C Small Retail Counter)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-xs text-text-secondary">
                Consolidated counter retail sales within state (POS: 27 Maharashtra): Taxable Value: <strong className="text-text-primary">{formatINR(summary.gstr1.b2c_small.taxableValue)}</strong>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tab 3: ITC Ledger */}
        {activeTab === 'itc_ledger' && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3 border-b border-border bg-surface-secondary/40">
                <CardTitle className="text-sm font-bold">
                  Inward Tax Invoices (Eligible Input Tax Credit Breakdown)
                </CardTitle>
                <CardDescription className="text-xs">
                  All active purchase bills recorded for October 2026
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Supplier</th>
                      <th className="px-4 py-2.5">GSTIN</th>
                      <th className="px-4 py-2.5">Bill #</th>
                      <th className="px-4 py-2.5 text-right">Taxable Value</th>
                      <th className="px-4 py-2.5 text-right">CGST (ITC)</th>
                      <th className="px-4 py-2.5 text-right">SGST (ITC)</th>
                      <th className="px-4 py-2.5 text-right">Total Eligible ITC</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {DEMO_INVOICES.filter(i => i.invoice_type === 'purchase_tax_invoice').map((inv) => (
                      <tr key={inv.id} className="hover:bg-surface-tertiary/50">
                        <td className="px-4 py-3 font-semibold text-text-primary">
                          {inv.supplier_legal_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-text-secondary">
                          {inv.supplier_gstin}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-text-primary">
                          {inv.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-text-primary">
                          {formatINR(inv.taxable_value)}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                          {formatINR(inv.cgst_amount || inv.cgst_total || '0.00')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-emerald-600 font-semibold">
                          {formatINR(inv.sgst_amount || inv.sgst_total || '0.00')}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                          {formatINR(inv.total_tax_amount || '0.00')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

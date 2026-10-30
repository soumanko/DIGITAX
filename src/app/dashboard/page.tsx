'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DEMO_SHOP, DEMO_INVOICES, DEMO_TRANSACTIONS } from '@/lib/demo-data';
import { formatINR } from '@/lib/decimal';
import {
  FileText,
  ArrowLeftRight,
  Calculator,
  MessageSquare,
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Download,
  ShieldCheck,
  ChevronRight,
  Plus
} from 'lucide-react';

export default function DashboardPage() {
  const [shop, setShop] = useState(DEMO_SHOP);
  const [invoices, setInvoices] = useState<any[]>(DEMO_INVOICES);
  const [transactions, setTransactions] = useState<any[]>(DEMO_TRANSACTIONS);
  const [isDemo, setIsDemo] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shopRes, invRes, txnRes] = await Promise.all([
        fetch('/api/shops'),
        fetch('/api/invoices'),
        fetch('/api/transactions'),
      ]);

      if (shopRes.ok) {
        const shopData = await shopRes.json();
        if (shopData.needsOnboarding) {
          window.location.href = '/onboarding';
          return;
        }
        if (shopData.shop) {
          setShop(shopData.shop);
          setIsDemo(Boolean(shopData.isDemo));
        }
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData.invoices)) {
          setInvoices(invData.invoices);
        }
      }

      if (txnRes.ok) {
        const txnData = await txnRes.json();
        if (Array.isArray(txnData.transactions)) {
          setTransactions(txnData.transactions);
        }
      }
    } catch (err: any) {
      console.warn('Dashboard live fetch notice, falling back to local cached view:', err);
      // Retain existing state if network drops
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const totalInwardTaxable = invoices
    .filter(i => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
    .reduce((acc, i) => acc + parseFloat(i.taxable_value || '0'), 0);

  const totalOutwardTaxable = invoices
    .filter(i => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
    .reduce((acc, i) => acc + parseFloat(i.taxable_value || '0'), 0);

  const totalITC = invoices
    .filter(i => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
    .reduce((acc, i) => acc + parseFloat(i.total_tax_amount || i.total_tax || '0.00'), 0);

  const totalOutwardTax = invoices
    .filter(i => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
    .reduce((acc, i) => acc + parseFloat(i.total_tax_amount || i.total_tax || '0.00'), 0);

  const netTaxPayable = Math.max(0, totalOutwardTax - totalITC);

  const pendingReviewCount = invoices.filter(i => i.review_state === 'pending_review').length;
  const unmatchedTxnCount = transactions.filter(t => t.reconciliation_status === 'unmatched').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Compliance Guardrail Disclaimer Banner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border shadow-xs text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary-600 shrink-0" />
            <span>
              <strong>Filing Review Mode:</strong> All figures are generated for taxpayer review & CA verification. DIGITAX does not submit returns directly to the GST portal.
            </span>
          </div>
          <Link href="/gst" className="hidden sm:inline-flex items-center text-primary-600 font-semibold hover:underline">
            View GST Workspace <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Top Header & Shop Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
                {shop.name}
              </h1>
              <Badge variant="success">Active</Badge>
              <Badge variant="outline">{shop.taxpayer_scheme.toUpperCase()}</Badge>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              GSTIN: <span className="font-mono font-medium text-text-primary">{shop.gstin || 'Unregistered'}</span> • State: {shop.state} ({shop.state_code}) • {shop.business_type}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link href="/documents">
              <Button variant="primary" size="sm" className="shadow-xs">
                <UploadCloud className="h-4 w-4 mr-1.5" /> Upload Bill / Invoice
              </Button>
            </Link>
            <Link href="/transactions">
              <Button variant="secondary" size="sm">
                <Plus className="h-4 w-4 mr-1.5" /> Import Statement
              </Button>
            </Link>
          </div>
        </div>

        {/* Filing Readiness Center Card */}
        <Card className="border-primary-200 dark:border-primary-800/60 bg-gradient-to-r from-primary-50/70 via-surface to-emerald-50/50 dark:from-primary-950/30 dark:via-surface dark:to-emerald-950/20 shadow-xs">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
                    October 2026 Return Preparation
                  </span>
                  <Badge variant="accent">Due in 25 Days</Badge>
                </div>
                <h3 className="text-lg font-bold text-text-primary">
                  Readiness: 85% Complete (Draft Ready)
                </h3>
                <p className="text-xs text-text-secondary max-w-xl">
                  5 invoices recorded, 3 bank transactions matched. 1 purchase invoice requires human verification before filing final summary.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Link href="/review">
                  <Button variant="secondary" size="sm" className="bg-surface">
                    <AlertTriangle className="h-4 w-4 mr-1 text-amber-600" />
                    Review Issues ({pendingReviewCount + unmatchedTxnCount})
                  </Button>
                </Link>
                <Link href="/exports">
                  <Button variant="primary" size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Export Return Summary
                  </Button>
                </Link>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 w-full bg-border rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-primary-600 to-emerald-600 h-2 rounded-full w-[85%]" />
            </div>
          </CardContent>
        </Card>

        {/* Financial KPI Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                <span>Outward Supplies (Sales)</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-extrabold mt-1">
                {formatINR(totalOutwardTaxable)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-text-secondary">
              2 Invoices (1 B2B, 1 Inter-state)
            </CardContent>
          </Card>

          {/* KPI 2 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                <span>Inward Supplies (Purchases)</span>
                <FileText className="h-4 w-4 text-primary-600" />
              </div>
              <CardTitle className="text-2xl font-extrabold mt-1">
                {formatINR(totalInwardTaxable)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-text-secondary">
              3 Bills (Apex, HUL, Britannia)
            </CardContent>
          </Card>

          {/* KPI 3 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                <span>Eligible ITC</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <CardTitle className="text-2xl font-extrabold mt-1 text-emerald-600">
                {formatINR(totalITC)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-text-secondary">
              Ready for GSTR-3B Table 4(A)(5)
            </CardContent>
          </Card>

          {/* KPI 4 */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between text-xs font-semibold text-text-secondary">
                <span>Net Tax Payable</span>
                <Calculator className="h-4 w-4 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-extrabold mt-1 text-primary-600">
                {formatINR(netTaxPayable)}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-text-secondary">
              {netTaxPayable === 0
                ? 'ITC fully offsets output GST liability'
                : 'Net cash tax payment required before GSTR-3B due date'}
            </CardContent>
          </Card>
        </div>

        {/* Quick Action Cards & Live Assistant */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Recent Invoices */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base font-bold">Recent Recorded Invoices</CardTitle>
                  <CardDescription className="text-xs">Extracted via OCR with confidence grading</CardDescription>
                </div>
                <Link href="/documents" className="text-xs font-semibold text-primary-600 hover:underline">
                  View all documents
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {invoices.length === 0 ? (
                  <div className="p-8 text-center text-xs text-text-secondary">
                    <p className="font-semibold text-text-primary mb-1">No invoices recorded yet</p>
                    <p className="text-[11px] mb-4">Upload vendor purchase bills or sales receipts to start automated bookkeeping.</p>
                    <Link href="/documents">
                      <Button size="sm" variant="primary">
                        <UploadCloud className="h-3.5 w-3.5 mr-1" /> Upload First Invoice
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                        <tr>
                          <th className="px-4 py-2.5">Invoice #</th>
                          <th className="px-4 py-2.5">Party</th>
                          <th className="px-4 py-2.5">Type</th>
                          <th className="px-4 py-2.5">Amount</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Review</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {invoices.slice(0, 10).map((inv) => (
                          <tr key={inv.id} className="hover:bg-surface-tertiary/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-medium text-text-primary">
                              {inv.invoice_number}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-text-primary">
                                {inv.invoice_type === 'purchase_tax_invoice' || inv.direction === 'purchase'
                                  ? inv.supplier_trade_name || inv.supplier_legal_name || inv.supplier_name || 'Vendor'
                                  : inv.customer_trade_name || inv.customer_legal_name || inv.customer_name || 'Customer'}
                              </div>
                              <div className="font-mono text-[11px] text-text-tertiary">
                                {inv.invoice_type === 'purchase_tax_invoice' || inv.direction === 'purchase'
                                  ? inv.supplier_gstin || 'Unregistered'
                                  : inv.customer_gstin || 'B2C Retail'}
                              </div>
                            </td>
                            <td className="px-4 py-3 capitalize">
                              {inv.invoice_type === 'purchase_tax_invoice' || inv.direction === 'purchase' ? 'Purchase' : 'Sales'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-text-primary">
                              {formatINR(inv.total_amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  inv.payment_status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {inv.payment_status || 'unpaid'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge
                                variant={
                                  inv.review_state === 'confirmed'
                                    ? 'success'
                                    : inv.review_state === 'pending_review'
                                    ? 'accent'
                                    : 'destructive'
                                }
                              >
                                {(inv.review_state || 'confirmed').replace('_', ' ')}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: AI Assistant Card & Pending Items */}
          <div className="space-y-4">
            {/* AI Assistant Widget */}
            <Card className="border-primary-200 dark:border-primary-800 bg-surface">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <CardTitle className="text-sm font-bold">GNANI EVON V3.3 Copilot</CardTitle>
                  </div>
                  <Badge variant="primary">Indic Voice</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="bg-primary-50/80 dark:bg-primary-950/40 p-3 rounded-lg border border-primary-200/50 dark:border-primary-800/40 text-primary-900 dark:text-primary-200 leading-relaxed italic">
                  &quot;नमस्ते राजेश जी! अक्टूबर माह के लिए आपके पास ₹18,306 का ITC उपलब्ध है। Britannia का बिल (#BRIT/2026/0491) जांचने के लिए तैयार है।&quot;
                </p>

                <div className="pt-1 flex flex-col gap-2">
                  <Link href="/assistant">
                    <Button variant="primary" size="sm" className="w-full text-xs">
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Open Voice / Text Assistant
                    </Button>
                  </Link>
                  <Link href="/reconciliation">
                    <Button variant="secondary" size="sm" className="w-full text-xs">
                      <ArrowLeftRight className="h-3.5 w-3.5 mr-1.5" />
                      Match Bank UPI Payments (2)
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Verification / Review Queue */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  Review Items Required
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                  <div className="font-semibold text-text-primary">Faded Bill #BRIT/2026/0491</div>
                  <div className="text-text-secondary mt-0.5">Confidence 84% • HSN 1905 requires confirmation</div>
                  <Link href="/review" className="mt-1.5 inline-block text-[11px] font-bold text-amber-700 hover:underline">
                    Resolve in Review Center →
                  </Link>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-secondary border border-border">
                  <div className="font-semibold text-text-primary">Unmatched Payment ₹4,680.00</div>
                  <div className="text-text-secondary mt-0.5">MSEDCL Electricity bill (Non-GST expense)</div>
                  <Link href="/reconciliation" className="mt-1.5 inline-block text-[11px] font-bold text-primary-600 hover:underline">
                    Categorize Transaction →
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

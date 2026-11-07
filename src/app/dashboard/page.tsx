'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatINR, money } from '@/lib/decimal';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { Invoice } from '@/types';
import {
  FileText,
  ArrowLeftRight,
  Calculator,
  MessageSquare,
  AlertTriangle,
  AlertCircle,
  UploadCloud,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowUpRight,
  TrendingUp,
  Download,
  ShieldCheck,
  ChevronRight,
  Plus,
  RefreshCw
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [shop, setShop] = useState<{ name: string; gstin: string | null; state: string | null; state_code: string | null; business_type: string | null; taxpayer_scheme: string | null; preferred_language: string | null } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [isDemo, setIsDemo] = useState(false);
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
          router.push('/onboarding');
          return;
        }
        if (shopData.shop) {
          setShop(shopData.shop);
          setIsDemo(Boolean(shopData.isDemo));
        }
      } else {
        throw new Error('Failed to load shop profile');
      }

      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData.invoices)) {
          setInvoices(invData.invoices);
        }
      } else {
        throw new Error('Failed to load invoices');
      }

      if (txnRes.ok) {
        const txnData = await txnRes.json();
        if (Array.isArray(txnData.transactions)) {
          setTransactions(txnData.transactions);
        }
      } else {
        throw new Error('Failed to load transactions');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchDashboardData();
    };
    loadData();
  }, []);

  const handleRetry = () => {
    fetchDashboardData();
  };

  // Financial calculations using decimal.js (DIGITAX-004)
  const totalInwardTaxable = invoices
    .filter(i => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
    .reduce((acc, i) => acc.plus(money(i.taxable_value || '0')), money(0));

  const totalOutwardTaxable = invoices
    .filter(i => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
    .reduce((acc, i) => acc.plus(money(i.taxable_value || '0')), money(0));

  const totalITC = invoices
    .filter(i => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
    .reduce((acc, i) => acc.plus(money(i.cgst_total || '0').plus(money(i.sgst_total || '0')).plus(money(i.igst_total || '0')).plus(money(i.cess_total || '0'))), money(0));

  const totalOutwardTax = invoices
    .filter(i => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
    .reduce((acc, i) => acc.plus(money(i.cgst_total || '0').plus(money(i.sgst_total || '0')).plus(money(i.igst_total || '0')).plus(money(i.cess_total || '0'))), money(0));

  const netTaxPayable = money(totalOutwardTax.minus(totalITC).isNegative() ? 0 : totalOutwardTax.minus(totalITC).toNumber());

  const pendingReviewCount = invoices.filter(i => i.review_state === 'pending_review').length;
  const unmatchedTxnCount = transactions.filter(t => t.reconciliation_status === 'unmatched').length;

  if (loading) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center h-full">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-600 animate-pulse">
                <RefreshCw className="h-5 w-5" />
              </div>
              <p className="text-sm text-text-secondary">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center text-center py-20">
          <Card>
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text-primary">Failed to Load Dashboard</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto">{error}</p>
              <Button onClick={handleRetry} variant="primary" className="mt-4">
                <RefreshCw className="h-4 w-4 mr-2" /> Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Compliance Guardrail Disclaimer Banner */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border shadow-xs text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary-600 shrink-0" />
            <span>
              <strong>Filing Review Mode:</strong> All figures are generated for taxpayer review & CA verification. DIGITAX does not submit returns directly to the GST portal.
            </span>
          </div>
          {shop && (
            <Link href="/gst" className="hidden sm:inline-flex items-center text-primary-600 font-semibold hover:underline">
              View GST Workspace <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>

        {/* Top Header & Shop Information */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {shop ? (
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
                    {escapeHtml(shop.name)}
                  </h1>
                  <Badge variant="success">Active</Badge>
                  <Badge variant="outline">{escapeHtml(shop.taxpayer_scheme || '')}</Badge>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">
                  GSTIN: <span className="font-mono font-medium text-text-primary">{escapeHtml(shop.gstin || 'Unregistered')}</span> â€¢ State: {escapeHtml(shop.state || '')} ({escapeHtml(shop.state_code || '')}) â€¢ {escapeHtml(shop.business_type || '')}
                </p>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">Dashboard</h1>
                <p className="text-xs sm:text-sm text-text-secondary mt-1">No shop data available.</p>
              </div>
            )}
          </div>
          {shop && (
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
          )}
        </div>

        {/* Filing Readiness Center Card */}
        {shop && (
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
                    {invoices.length} invoices recorded, {transactions.filter(t => t.reconciliation_status === 'matched').length} bank transactions matched. {pendingReviewCount} item(s) require human verification before filing final summary.
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
              <div className="mt-4 w-full bg-border rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-primary-600 to-emerald-600 h-2 rounded-full w-[85%]" />
              </div>
            </CardContent>
          </Card>
        )}

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
                {formatINR(totalOutwardTaxable.toString())}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-text-secondary">
              {invoices.filter(i => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales').length} Invoices
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
                {formatINR(totalInwardTaxable.toString())}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-text-secondary">
              {invoices.filter(i => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase').length} Bills
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
                {formatINR(totalITC.toString())}
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
                {formatINR(netTaxPayable.toString())}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-text-secondary">
              {netTaxPayable.isZero()
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
                              {escapeHtml(inv.invoice_number)}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-medium text-text-primary">
                                {inv.invoice_type === 'purchase_tax_invoice' || inv.direction === 'purchase'
                                  ? escapeHtml(inv.supplier_trade_name || inv.supplier_legal_name || inv.supplier_name || 'Vendor')
                                  : escapeHtml(inv.customer_trade_name || inv.customer_legal_name || inv.buyer_name || 'Customer')}
                              </div>
                              <div className="font-mono text-[11px] text-text-tertiary">
                                {inv.invoice_type === 'purchase_tax_invoice' || inv.direction === 'purchase'
                                  ? escapeHtml(inv.supplier_gstin || 'Unregistered')
                                  : escapeHtml(inv.customer_gstin || 'B2C Retail')}
                              </div>
                            </td>
                            <td className="px-4 py-3 capitalize">
                              {inv.invoice_type === 'purchase_tax_invoice' || inv.direction === 'purchase' ? 'Purchase' : 'Sales'}
                            </td>
                            <td className="px-4 py-3 font-semibold text-text-primary">
                              {formatINR(escapeHtml(inv.total_amount))}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  inv.payment_status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}
                              >
                                {escapeHtml(inv.payment_status || 'unpaid')}
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
                                {escapeHtml((inv.review_state || 'confirmed').replace('_', ' '))}
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
                  &quot;Configure your GNANI_EVON_API_KEY to enable AI-powered assistance. Until then, use the Dashboard, GST Workspace, and Reconciliation Center to manage your bookkeeping.&quot;
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
                      Match Bank UPI Payments ({unmatchedTxnCount})
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Verification / Review Queue */}
            {pendingReviewCount > 0 || unmatchedTxnCount > 0 ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Review Items Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 text-xs">
                  {pendingReviewCount > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40">
                      <div className="font-semibold text-text-primary">Invoices Requiring Review</div>
                      <div className="text-text-secondary mt-0.5">{pendingReviewCount} invoice(s) need human verification before filing.</div>
                      <Link href="/review" className="mt-1.5 inline-block text-[11px] font-bold text-amber-700 hover:underline">
                        Resolve in Review Center â†’
                      </Link>
                    </div>
                  )}
                  {unmatchedTxnCount > 0 && (
                    <div className="p-2.5 rounded-lg bg-surface-secondary border border-border">
                      <div className="font-semibold text-text-primary">Unmatched Transactions</div>
                      <div className="text-text-secondary mt-0.5">{unmatchedTxnCount} transaction(s) awaiting reconciliation.</div>
                      <Link href="/reconciliation" className="mt-1.5 inline-block text-[11px] font-bold text-primary-600 hover:underline">
                        Categorize Transaction â†’
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="p-8 text-center border-dashed">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-base font-bold text-text-primary">
                  All Items Verified & Cleared
                </h3>
                <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                  No pending review items or unmatched transactions remain.
                </p>
                <div className="mt-4">
                  <Link href="/exports">
                    <Button variant="primary" size="sm">
                      Proceed to Return Exports â†’
                    </Button>
                  </Link>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}




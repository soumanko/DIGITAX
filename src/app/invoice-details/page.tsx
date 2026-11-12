'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Download,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Invoice } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface FetchedInvoice extends Invoice {
  invoice_items?: Array<{
    description: string;
    quantity: number | null;
    unit_price: number | null;
    gst_rate: number;
    total_amount: number;
    line_number: number;
  }>;
}

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

function formatMoney(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '₹0.00';
  const num = typeof value === 'number' ? value : parseFloat(value);
  if (Number.isNaN(num)) return '₹0.00';
  return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
}

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function initialsOf(email: string | null): string {
  if (!email) return '—';
  const local = email.split('@')[0] || '';
  return (local.slice(0, 2) || '—').toUpperCase();
}

function paymentLabel(status: string | undefined): string {
  if (status === 'paid') return 'Paid';
  if (status === 'partial') return 'Partial';
  if (status === 'unpaid') return 'Unpaid';
  return '—';
}

function InvoiceDetailsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');

  const [invoice, setInvoice] = useState<FetchedInvoice | null>(null);
  const [loadState, setLoadState] = useState<LoadState>(invoiceId ? 'loading' : 'idle');
  const [businessName, setBusinessName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const isSample = !invoiceId;

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.resolve();
      if (!active) return;
      if (!invoiceId) {
        setInvoice(null);
        setLoadState('idle');
        return;
      }
      setLoadState('loading');
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        if (active && res.ok) {
          const data = await res.json();
          setInvoice((data as { invoice?: FetchedInvoice }).invoice ?? null);
          setLoadState('ready');
        } else if (active) {
          setLoadState('error');
        }
      } catch {
        if (active) setLoadState('error');
      }
    })();
    return () => {
      active = false;
    };
  }, [invoiceId]);

  useEffect(() => {
    let active = true;
    (async () => {
      // Local context data for the sidebar identity (real business + real user).
      try {
        const res = await fetch('/api/shops');
        if (active && res.ok) {
          const data = await res.json();
          if (data?.shop?.name) setBusinessName(data.shop.name);
        }
      } catch {
        // Sidebar falls back to neutral copy
      }
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (active && data?.user?.email) setUserEmail(data.user.email);
      } catch {
        // Sidebar falls back to neutral copy
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const invoiceNumber = invoice?.invoice_number || 'INV-2024-0186';
  const isSales = invoice?.direction === 'sales';
  const counterpartyName = isSample
    ? 'Tata Communications Ltd.'
    : isSales
      ? invoice?.customer_legal_name || invoice?.buyer_name || '—'
      : invoice?.supplier_legal_name || invoice?.supplier_name || '—';
  const counterpartyGstin = isSample
    ? 'GSTIN 27AAACT1234F1Z7'
    : `GSTIN ${isSales ? invoice?.buyer_gstin || invoice?.customer_gstin : invoice?.supplier_gstin || 'Not registered'}`;
  const counterpartyAddress = isSample
    ? 'Vikhroli West, Mumbai, Maharashtra 400079'
    : (isSales ? invoice?.customer_address : invoice?.supplier_address) || 'Address not recorded';
  const paymentStatus = invoice?.payment_status || 'unpaid';
  const amountPaid = invoice ? invoice.amount_paid || invoice.paid_amount || '0' : '0';
  const amountDue = invoice ? invoice.amount_due || invoice.total_amount || '0' : '0';
  const cgstTotal = invoice ? invoice.cgst_total || invoice.cgst_amount || '0' : '0';
  const sgstTotal = invoice ? invoice.sgst_total || invoice.sgst_amount || '0' : '0';
  const igstTotal = invoice ? invoice.igst_total || invoice.igst_amount || '0' : '0';
  const items = invoice?.invoice_items?.slice().sort((a, b) => (a.line_number ?? 0) - (b.line_number ?? 0)) ?? null;
  const avatarInitials = isSample ? 'SB' : initialsOf(userEmail);
  const sidebarBusiness = isSample ? 'Sample Business (Demo)' : businessName || 'Your business';
  const sidebarUserName = isSample ? 'Sample User' : userEmail || 'Not signed in';
  const sidebarUserRole = isSample ? 'Demo layout' : userEmail ? 'Signed in' : 'Not signed in';

  const paymentDone = paymentStatus === 'paid';
  const connectorDone = paymentDone ? 'bg-primary w-px h-10' : 'bg-border w-px h-10';
  const circleDone = 'rounded-full bg-primary text-primary-foreground flex justify-center items-center size-6';
  const circlePending = 'rounded-full border border-border text-muted-foreground flex justify-center items-center size-6';

  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground w-full h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <aside className="bg-sidebar text-sidebar-foreground border-y border-r border-border flex fixed inset-y-0 left-0 px-4 py-5 flex-col w-64">
          <div className="flex px-3 items-center h-8">
            <span className="font-semibold text-foreground text-lg tracking-[0.18em]">
              DIGITAX
            </span>
          </div>
          <button className="text-left rounded-md bg-card text-foreground text-sm border border-border flex mt-6 px-3 justify-between items-center w-full h-11">
            <span className="flex items-center gap-2 min-w-0">
              <Building2 className="text-muted-foreground shrink-0 size-4" />
              <span className="text-ellipsis whitespace-nowrap overflow-hidden">
                {sidebarBusiness}
              </span>
            </span>
            <ChevronsUpDown className="text-muted-foreground shrink-0 size-4" />
          </button>
          <nav className="flex mt-7 flex-col flex-1 gap-1">
            <a
              href="/dashboard"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </a>
            <a
              href="/invoices"
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
            >
              <ArrowLeftRight className="size-4" />
              <span>Invoices</span>
            </a>
            <a
              href="/gst"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <ReceiptText className="size-4" />
              <span>{`GST & Tax`}</span>
            </a>
            <a
              href="/banking"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Landmark className="size-4" />
              <span>Banking</span>
            </a>
            <a
              href="/reports"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <BarChart3 className="size-4" />
              <span>Reports</span>
            </a>
            <a
              href="/contacts"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Users className="size-4" />
              <span>Contacts</span>
            </a>
            <a
              href="/settings"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </a>
          </nav>
          <div className="border-x border-t border-b flex pt-4 flex-col gap-2">
            <a
              href="/faq"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <CircleHelp className="size-4" />
              <span>{`Help & support`}</span>
            </a>
            <button className="text-left rounded-md flex px-3 py-2 items-center gap-3 hover:bg-accent active:bg-muted hover:active:bg-muted">
              <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8">
                {avatarInitials}
              </span>
              <span className="min-w-0">
                <span className="font-medium text-ellipsis whitespace-nowrap text-foreground text-sm block overflow-hidden">
                  {sidebarUserName}
                </span>
                <span className="text-ellipsis whitespace-nowrap text-muted-foreground text-xs block overflow-hidden">
                  {sidebarUserRole}
                </span>
              </span>
              <MoreHorizontal className="text-muted-foreground ml-auto shrink-0 size-4" />
            </button>
          </div>
        </aside>
        <div className="ml-64 min-h-screen">
          <header className="bg-background border-t border-r border-b border-b-border border-l-border flex fixed z-10 top-0 right-0 left-64 px-8 justify-between items-center h-16">
            <div className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">DIGITAX</span>
              <ChevronRight className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">Invoices</span>
              <ChevronRight className="text-muted-foreground size-4" />
              <span className="font-medium text-foreground">{invoiceNumber}</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="rounded-md bg-card border border-border flex px-3 items-center gap-2 w-64 h-9">
                <Search className="text-muted-foreground size-4" />
                <input
                  type="search"
                  placeholder="Search"
                  className="bg-transparent text-foreground text-sm outline-none w-full placeholder:text-muted-foreground"
                />
              </label>
              <button
                aria-label="Notifications"
                className="rounded-md text-muted-foreground flex justify-center items-center size-9 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <Bell className="size-4" />
              </button>
              <button
                aria-label="Open profile"
                className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center size-8"
              >
                {avatarInitials}
              </button>
            </div>
          </header>
          <main className="px-8 pt-24 pb-8">
            {loadState === 'loading' && (
              <div className="text-muted-foreground text-sm py-24 text-center">Loading invoice…</div>
            )}
            {loadState === 'error' && (
              <div className="py-24 text-center">
                <p className="text-foreground font-medium text-sm">Could not load this invoice.</p>
                <p className="text-muted-foreground text-sm mt-2">
                  It may have been deleted, or you may not have access to it in the active business.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => router.push('/invoices')}>
                  <ArrowLeft className="mr-2 size-4" /> Back to invoices
                </Button>
              </div>
            )}
            {(loadState === 'idle' || loadState === 'ready') && (
              <>
                <div className="flex mb-6 justify-between items-end">
                  <div>
                    <a
                      href="/invoices"
                      className="text-muted-foreground text-sm inline-flex mb-3 items-center gap-2 hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault();
                        router.push('/invoices');
                      }}
                    >
                      <ArrowLeft className="size-4" />
                      <span>Back to invoices</span>
                    </a>
                    <div className="flex items-center gap-3">
                      <h1 className="font-semibold text-2xl tracking-tight">
                        Invoice {invoiceNumber}
                      </h1>
                      {isSample ? (
                        <>
                          <Badge className="bg-primary/10 text-primary">Paid</Badge>
                          <Badge className="bg-muted text-muted-foreground">Sample</Badge>
                        </>
                      ) : (
                        <Badge
                          className={
                            paymentStatus === 'paid'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }
                        >
                          {paymentLabel(paymentStatus)}
                        </Badge>
                      )}
                    </div>
                    {isSample && (
                      <p className="text-muted-foreground text-sm mt-2 max-w-xl">
                        This is a sample layout. Open an invoice from the{' '}
                        <a href="/invoices" className="underline hover:text-foreground">
                          Invoices
                        </a>{' '}
                        page to view your live records.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      disabled
                      title="PDF generation is not connected in this release — export GSTR and register data from the Exports page."
                    >
                      <Download className="mr-2 size-4" />
                      Download PDF
                    </Button>
                    <Button
                      disabled
                      title="Payments are captured through reconciliation — match this invoice with a bank transaction on the Reconciliation page."
                    >
                      Record payment
                    </Button>
                  </div>
                </div>
                <div className="grid items-start gap-6 grid-cols-3">
                  <Card className="col-span-2">
                    <CardHeader className="border-t border-r border-b border-b-border border-l-border">
                      <CardTitle>{isSample || !isSales ? 'Invoice from' : 'Invoice to'}</CardTitle>
                      <CardDescription>Invoice {invoiceNumber}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="border-t border-r border-b border-b-border border-l-border grid pb-6 gap-6 grid-cols-2">
                        <div>
                          <p className="font-semibold text-lg">
                            {counterpartyName}
                          </p>
                          <p className="text-muted-foreground text-sm mt-1">
                            {counterpartyGstin}
                          </p>
                          <p className="text-muted-foreground text-sm mt-3">
                            {counterpartyAddress}
                          </p>
                        </div>
                        <div className="text-sm grid gap-4 grid-cols-2">
                          <div>
                            <p className="text-muted-foreground">Invoice date</p>
                            <p className="font-medium mt-1">{formatDate(invoice?.invoice_date || '2024-06-21')}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due date</p>
                            <p className="font-medium mt-1">{formatDate(invoice?.due_date || '2024-07-21')}</p>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-md border border-border mt-6 overflow-hidden">
                        <table className="text-sm w-full">
                          <thead className="bg-muted text-muted-foreground">
                            <tr>
                              <th className="font-medium text-left px-4 py-3">
                                Description
                              </th>
                              <th className="font-medium text-right px-4 py-3">
                                Qty
                              </th>
                              <th className="font-medium text-right px-4 py-3">
                                Rate
                              </th>
                              <th className="font-medium text-right px-4 py-3">
                                Tax
                              </th>
                              <th className="font-medium text-right px-4 py-3">
                                Amount
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {items && items.length > 0 ? (
                              items.map((item) => (
                                <tr key={item.line_number ?? item.description} className="border-x border-t border-b">
                                  <td className="font-medium p-4">
                                    {item.description}
                                  </td>
                                  <td className="text-right p-4">{item.quantity ?? 1}</td>
                                  <td className="text-right p-4">{formatMoney(item.unit_price ?? 0)}</td>
                                  <td className="text-right p-4">{Number(item.gst_rate || 0)}%</td>
                                  <td className="font-medium text-right p-4">
                                    {formatMoney(item.total_amount)}
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <>
                                <tr className="border-x border-t border-b">
                                  <td className="font-medium p-4">
                                    Dedicated internet line
                                  </td>
                                  <td className="text-right p-4">1</td>
                                  <td className="text-right p-4">₹20,000</td>
                                  <td className="text-right p-4">18%</td>
                                  <td className="font-medium text-right p-4">
                                    ₹23,600
                                  </td>
                                </tr>
                                <tr className="border-x border-t border-b">
                                  <td className="font-medium p-4">Managed router</td>
                                  <td className="text-right p-4">1</td>
                                  <td className="text-right p-4">₹650</td>
                                  <td className="text-right p-4">18%</td>
                                  <td className="font-medium text-right p-4">₹767</td>
                                </tr>
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="text-sm mt-6 ml-auto max-w-xs">
                        {isSample || !invoice ? (
                          <>
                            <div className="flex mb-3 justify-between">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>₹20,650</span>
                            </div>
                            <div className="flex mb-3 justify-between">
                              <span className="text-muted-foreground">CGST</span>
                              <span>₹1,858</span>
                            </div>
                            <div className="flex mb-3 justify-between">
                              <span className="text-muted-foreground">SGST</span>
                              <span>₹1,858</span>
                            </div>
                            <div className="font-semibold text-base border-x border-t border-b flex pt-3 justify-between">
                              <span>Total</span>
                              <span>₹24,366</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex mb-3 justify-between">
                              <span className="text-muted-foreground">Subtotal</span>
                              <span>{formatMoney(invoice.taxable_value)}</span>
                            </div>
                            {Number(cgstTotal) > 0 && (
                              <div className="flex mb-3 justify-between">
                                <span className="text-muted-foreground">CGST</span>
                                <span>{formatMoney(cgstTotal)}</span>
                              </div>
                            )}
                            {Number(sgstTotal) > 0 && (
                              <div className="flex mb-3 justify-between">
                                <span className="text-muted-foreground">SGST</span>
                                <span>{formatMoney(sgstTotal)}</span>
                              </div>
                            )}
                            {Number(igstTotal) > 0 && (
                              <div className="flex mb-3 justify-between">
                                <span className="text-muted-foreground">IGST</span>
                                <span>{formatMoney(igstTotal)}</span>
                              </div>
                            )}
                            <div className="font-semibold text-base border-x border-t border-b flex pt-3 justify-between">
                              <span>Total</span>
                              <span>{formatMoney(invoice.total_amount)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="border-t border-r border-b border-b-border border-l-border">
                      <CardTitle>Payment status</CardTitle>
                      <CardDescription>
                        {isSample || !invoice
                          ? 'Payment completed'
                          : paymentStatus === 'paid'
                            ? 'Payment completed'
                            : paymentStatus === 'partial'
                              ? 'Partially paid'
                              : 'Payment pending'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="rounded-md bg-muted p-4">
                        {isSample || !invoice || paymentDone ? (
                          <>
                            <p className="text-muted-foreground text-sm">Paid amount</p>
                            <p className="font-semibold text-2xl mt-1">
                              {isSample || !invoice ? '₹24,366' : formatMoney(amountPaid)}
                            </p>
                            <p className="text-muted-foreground text-sm mt-2">
                              {isSample
                                ? 'Paid on 22 Jun 2024'
                                : paymentDone
                                  ? 'Payment recorded against this invoice.'
                                  : 'No payment recorded yet.'}
                            </p>
                            <p className="font-medium text-sm mt-1">
                              {isSample || !invoice ? 'ICICI Current Account' : '—'}
                            </p>
                          </>
                        ) : paymentStatus === 'partial' ? (
                          <>
                            <p className="text-muted-foreground text-sm">Paid amount</p>
                            <p className="font-semibold text-2xl mt-1">{formatMoney(amountPaid)}</p>
                            <p className="text-muted-foreground text-sm mt-2">
                              Outstanding: {formatMoney(amountDue)}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-muted-foreground text-sm">Amount due</p>
                            <p className="font-semibold text-2xl mt-1">{formatMoney(amountDue)}</p>
                            <p className="text-muted-foreground text-sm mt-2">
                              No payment recorded yet.
                            </p>
                          </>
                        )}
                      </div>
                      <div className="mt-6">
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className={isSample || invoice ? circleDone : circlePending}>
                              <Check className="size-4" />
                            </span>
                            <span className={isSample || invoice ? connectorDone : connectorDone.replace('bg-primary', 'bg-border')} />
                          </div>
                          <div className="pb-6">
                            <p className="font-medium text-sm">Invoice received</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              {formatDate(invoice?.invoice_date || '2024-06-21')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <span className={paymentDone ? circleDone : circlePending}>
                              {paymentDone && <Check className="size-4" />}
                            </span>
                            <span className={paymentDone ? connectorDone : connectorDone.replace('bg-primary', 'bg-border')} />
                          </div>
                          <div className="pb-6">
                            <p className="font-medium text-sm">Matched to bank</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              {paymentDone ? 'Via reconciliation match' : 'Waiting for reconciliation'}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <div className={paymentDone ? circleDone : circlePending}>
                            {paymentDone && <Check className="size-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-sm">Payment recorded</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              {paymentDone ? 'Recorded in your books' : 'Not paid yet'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="mt-6">
                  <CardHeader className="border-t border-r border-b border-b-border border-l-border">
                    <CardTitle>Activity</CardTitle>
                    <CardDescription>
                      Notes and updates for this invoice
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    {isSample || !invoice ? (
                      <div className="flex flex-col gap-5">
                        <div className="flex gap-3">
                          <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8" />
                          <div>
                            <p className="font-medium text-sm">Sample reviewer</p>
                            <p className="text-muted-foreground text-sm mt-1">
                              (Sample) Invoice matched with the purchase order and approved for
                              payment.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8" />
                          <div>
                            <p className="font-medium text-sm">Sample reviewer</p>
                            <p className="text-muted-foreground text-sm mt-1">
                              (Sample) Payment confirmation received from the bank current
                              account.
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5">
                        {invoice.notes ? (
                          <div className="flex gap-3">
                            <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8">
                              {avatarInitials}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{userEmail || 'Recorded note'}</p>
                              <p className="text-muted-foreground text-sm mt-1 whitespace-pre-line">
                                {invoice.notes}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">
                            No notes or recorded activity for this invoice yet.
                          </p>
                        )}
                      </div>
                    )}
                    <div className="border-x border-t border-b flex mt-6 pt-5 items-center gap-3">
                      <Input placeholder="Notes are view-only in this release" disabled defaultValue="" />
                      <Button disabled title="Posting notes is not connected to a notes service yet in this release.">
                        Post note
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function InvoiceDetails() {
  return (
    <Suspense fallback={null}>
      <InvoiceDetailsInner />
    </Suspense>
  );
}

'use client';

import React, { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';
import { formatINR } from '@/lib/decimal';

interface InvoiceShape {
  id: string;
  invoice_number: string;
  supplier_name?: string | null;
  supplier_gstin?: string | null;
  buyer_name?: string | null;
  buyer_gstin?: string | null;
  amount_due: string;
  outstanding_balance?: string;
  payment_status?: string;
  total_amount: string;
  invoice_date: string;
  cgst_amount?: string;
  cgst_total?: string;
  sgst_amount?: string;
  sgst_total?: string;
  igst_amount?: string;
  igst_total?: string;
  place_of_supply?: string | null;
  direction: string;
  invoice_type: string;
}

interface LedgerTransaction {
  id: string;
  description?: string;
  transaction_date?: string;
  direction: string;
  amount: string;
  bank_account_name?: string;
  source_account?: string;
  reconciliation_status: string;
}

function contactInitials(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function gstOf(inv: InvoiceShape): number {
  const cgst = parseFloat((inv.cgst_amount || inv.cgst_total || '0').toString().replace(/,/g, '')) || 0;
  const sgst = parseFloat((inv.sgst_amount || inv.sgst_total || '0').toString().replace(/,/g, '')) || 0;
  const igst = parseFloat((inv.igst_amount || inv.igst_total || '0').toString().replace(/,/g, '')) || 0;
  return cgst + sgst + igst;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
}

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contactName = (searchParams.get('name') || '').trim();
  const contactKind = (searchParams.get('kind') || 'vendor').toLowerCase();

  const {
    shop,
    loading: ctxLoading,
    error: ctxError,
    needsOnboarding,
    userEmail,
    refresh,
  } = useShopContext();
  const [invoices, setInvoices] = useState<InvoiceShape[] | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
    setInvoices(null);
    setTransactions(null);
    setDataError(null);
      try {
        const [invRes, txnRes] = await Promise.all([
          fetch('/api/invoices?limit=100', { cache: 'no-store' }),
          fetch('/api/transactions?limit=100', { cache: 'no-store' }),
        ]);
        if (cancelled) return;
        const invData = await invRes.json().catch(() => null);
        const txnData = await txnRes.json().catch(() => null);
        if (!invRes.ok || !txnRes.ok) {
          setDataError(
            invData?.error || txnData?.error || 'Contact records could not be loaded right now.'
          );
          setInvoices([]);
          setTransactions([]);
          return;
        }
        setInvoices(Array.isArray(invData?.invoices) ? invData.invoices : []);
        setTransactions(Array.isArray(txnData?.transactions) ? txnData.transactions : []);
      } catch {
        if (!cancelled) {
          setDataError('Network error while loading this contact.');
          setInvoices([]);
          setTransactions([]);
        }
      }
    }
    if (!ctxLoading && contactName) load();
    return () => {
      cancelled = true;
    };
  }, [ctxLoading, shop?.id, contactName]);

  const isVendor = contactKind === 'vendor';

  const relatedInvoices = useMemo(() => {
    const target = contactName.toLowerCase();
    return (invoices || []).filter((inv) => {
      const party = isVendor ? inv.supplier_name : inv.buyer_name;
      return (party || '').toLowerCase() === target;
    });
  }, [invoices, contactName, isVendor]);

  const contactFieldValues = useMemo(() => {
    const gstins = new Set<string>();
    for (const inv of relatedInvoices) {
      const g = isVendor ? inv.supplier_gstin : inv.buyer_gstin;
      if (g) gstins.add(g);
    }
    const pos = new Set<string>();
    for (const inv of relatedInvoices) {
      if (inv.place_of_supply) pos.add(inv.place_of_supply);
    }
    return { gstin: Array.from(gstins)[0] || null, placeOfSupply: Array.from(pos)[0] || null };
  }, [relatedInvoices, isVendor]);

  const openBalance = relatedInvoices
    .filter((i) => (i.payment_status || 'unpaid') !== 'paid')
    .reduce((sum, i) => sum + (parseFloat((i.outstanding_balance ?? i.amount_due ?? '0').toString().replace(/,/g, '')) || 0), 0);
  const totalPaid = relatedInvoices
    .filter((i) => (i.payment_status || 'unpaid') === 'paid')
    .reduce((sum, i) => sum + (parseFloat((i.total_amount || '0').toString().replace(/,/g, '')) || 0), 0);
  const lastActivity = relatedInvoices.reduce<string | null>((latest, i) => {
    const d = i.invoice_date || null;
    if (d && (!latest || new Date(d) > new Date(latest))) return d;
    return latest;
  }, null);
  const taxCredited = relatedInvoices.reduce((sum, i) => sum + gstOf(i), 0);

  const relatedTransactions = useMemo(() => {
    const target = contactName.toLowerCase();
    const words = target.split(' ').filter((w) => w.length > 2);
    return (transactions || []).filter((t) => {
      const desc = (t.description || '').toLowerCase();
      if (!desc) return false;
      return words.some((w) => desc.includes(w)) || desc.includes(target);
    });
  }, [transactions, contactName]);

  const displayName = contactName || 'Unknown contact';
  const reviewNeeded = !contactFieldValues.gstin;

  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground w-full h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <div className="bg-background text-foreground min-h-screen">
          <aside className="bg-sidebar text-sidebar-foreground border-y border-r border-border flex fixed inset-y-0 left-0 px-4 py-5 flex-col w-64">
            <div className="flex px-3 items-center h-8">
              <span className="font-semibold text-foreground text-lg tracking-[0.18em]">
                DIGITAX
              </span>
            </div>
            <button className="text-left rounded-md bg-card text-foreground text-sm border border-border flex mt-6 px-3 justify-between items-center w-full h-11">
              <span className="flex items-center gap-2 min-w-0">
                <Building2 className="text-muted-foreground shrink-0 size-4" />
                <StaticBusinessName />
              </span>
              <ChevronsUpDown className="text-muted-foreground shrink-0 size-4" />
            </button>
            <nav className="flex mt-7 flex-col flex-1 gap-1">
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                onClick={() => router.push('/dashboard')}
              >
                <LayoutDashboard className="size-4" />
                <span>Overview</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                onClick={() => router.push('/transactions')}
              >
                <ArrowLeftRight className="size-4" />
                <span>Transactions</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                onClick={() => router.push('/gst')}
              >
                <ReceiptText className="size-4" />
                <span>{`GST & Tax`}</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                onClick={() => router.push('/banking')}
              >
                <Landmark className="size-4" />
                <span>Banking</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                onClick={() => router.push('/reports')}
              >
                <BarChart3 className="size-4" />
                <span>Reports</span>
              </a>
              <a
                href="#"
                className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
              >
                <Users className="size-4" />
                <span>Contacts</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                onClick={() => router.push('/settings')}
              >
                <Settings className="size-4" />
                <span>Settings</span>
              </a>
            </nav>
            <div className="border-x border-t border-b flex pt-4 flex-col gap-2">
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <CircleHelp className="size-4" />
                <span>{`Help & support`}</span>
              </a>
              <button className="text-left rounded-md flex px-3 py-2 items-center gap-3 hover:bg-accent active:bg-muted hover:active:bg-muted">
                <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8">
                  {identityInitials(userEmail)}
                </span>
                <span className="min-w-0">
                  <span className="font-medium text-ellipsis whitespace-nowrap text-foreground text-sm block overflow-hidden">
                    {userEmail || 'Signed in'}
                  </span>
                  <span className="text-ellipsis whitespace-nowrap text-muted-foreground text-xs block overflow-hidden">
                    Account
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
                <span className="text-muted-foreground">Contacts</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="font-medium text-foreground truncate max-w-72">
                  {displayName}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <label className="rounded-md bg-card border border-border flex px-3 items-center gap-2 w-64 h-9">
                  <Search className="text-muted-foreground size-4" />
                  <input
                    type="search"
                    placeholder="Search"
                    defaultValue=""
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
                  {identityInitials(userEmail)}
                </button>
              </div>
            </header>
            <main className="px-8 pt-24 pb-10 min-h-screen">
              <a
                href="#"
                className="text-muted-foreground text-sm flex mb-5 items-center gap-2 hover:text-foreground"
                onClick={() => router.push('/contacts')}
              >
                <ArrowLeft className="size-4" />
                <span>Back to contacts</span>
              </a>
              {ctxError || dataError ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <Building2 className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">
                      {ctxError ? 'Could not load your business context.' : dataError}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Contact records are shown only from this business&apos;s own invoices and statements.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => refresh()}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : ctxLoading || invoices === null || transactions === null ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <p className="font-medium text-muted-foreground">Loading contact…</p>
                  </CardContent>
                </Card>
              ) : needsOnboarding ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <Building2 className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">No business yet</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Complete onboarding to view contacts for your business.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                      Set up business
                    </Button>
                  </CardContent>
                </Card>
              ) : contactName === '' ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <Users className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">No contact selected</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Choose a contact from the Contacts page to see its profile.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => router.push('/contacts')}>
                      Go to contacts
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="mb-6">
                    <CardContent className="flex p-6 justify-between items-center">
                      <div className="flex items-center gap-4">
                        <Avatar className="size-14">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {contactInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <h1 className="font-semibold text-2xl truncate max-w-xl">
                              {displayName}
                            </h1>
                            {reviewNeeded ? (
                              <Badge className="bg-chart-3/15 text-foreground">
                                Review needed
                              </Badge>
                            ) : (
                              <Badge className="bg-primary/10 text-primary">
                                Active
                              </Badge>
                            )}
                            <Badge variant="outline">{isVendor ? 'Vendor' : 'Customer'}</Badge>
                          </div>
                          <p className="text-muted-foreground text-sm">
                            {contactFieldValues.gstin
                              ? `GSTIN ${contactFieldValues.gstin}`
                              : 'GSTIN missing — add it when recording the next invoice'}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {relatedInvoices.length} invoice{relatedInvoices.length === 1 ? '' : 's'} on record for this business
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          disabled
                          title="Editing contact details is done on the invoice itself — DIGITAX derives contacts from invoice counterparties."
                        >
                          Edit contact
                        </Button>
                        <Button
                          onClick={() => router.push('/invoices')}
                          title="Opens the invoice workspace"
                        >
                          Create bill
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Tabs defaultValue="overview">
                    <TabsList className="mb-6">
                      <TabsTrigger value="overview">Overview</TabsTrigger>
                      <TabsTrigger value="transactions">
                        Transactions ({relatedTransactions.length})
                      </TabsTrigger>
                      <TabsTrigger value="documents">
                        Invoices ({relatedInvoices.length})
                      </TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="mb-6">
                      <div className="grid mb-6 gap-4 grid-cols-3">
                        <Card>
                          <CardContent className="p-5">
                            <p className="text-muted-foreground text-sm">
                              Open balance
                            </p>
                            <p className="font-semibold text-2xl mt-2">
                              {formatINR(openBalance)}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-5">
                            <p className="text-muted-foreground text-sm">
                              Total {isVendor ? 'paid' : 'collected'}
                            </p>
                            <p className="font-semibold text-2xl mt-2">
                              {formatINR(totalPaid)}
                            </p>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-5">
                            <p className="text-muted-foreground text-sm">
                              Last activity
                            </p>
                            <p className="font-semibold text-2xl mt-2">
                              {fmtDate(lastActivity)}
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                      <div className="grid mb-6 gap-6 grid-cols-5">
                        <Card className="col-span-3">
                          <CardHeader>
                            <CardTitle>
                              Recent {isVendor ? 'bills' : 'invoices'}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {relatedInvoices.length === 0 ? (
                              <div className="py-6 text-center">
                                <p className="font-medium">No invoices recorded</p>
                                <p className="text-muted-foreground text-sm mt-1">
                                  Invoices naming this contact appear here.
                                </p>
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Invoice</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {relatedInvoices.slice(0, 3).map((inv) => (
                                    <TableRow key={inv.id}>
                                      <TableCell>{inv.invoice_number}</TableCell>
                                      <TableCell>{fmtDate(inv.invoice_date)}</TableCell>
                                      <TableCell>
                                        {formatINR(inv.total_amount || '0')}
                                      </TableCell>
                                      <TableCell>
                                        <Badge
                                          variant={
                                            (inv.payment_status || 'unpaid') === 'paid'
                                              ? 'secondary'
                                              : 'outline'
                                          }
                                        >
                                          {(inv.payment_status || 'unpaid') === 'paid'
                                            ? 'Paid'
                                            : 'Open'}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </CardContent>
                        </Card>
                        <Card className="col-span-2">
                          <CardHeader>
                            <CardTitle>Tax details</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="flex mb-5 justify-between items-center">
                              <span className="text-muted-foreground text-sm">
                                {isVendor ? 'GST treatment' : 'GST registration'}
                              </span>
                              <span className="font-medium text-sm">
                                {contactFieldValues.gstin ? 'Regular' : 'Unregistered / missing'}
                              </span>
                            </div>
                            <div className="flex mb-5 justify-between items-center">
                              <span className="text-muted-foreground text-sm">
                                Place of supply
                              </span>
                              <span className="font-medium text-sm">
                                {contactFieldValues.placeOfSupply || shop?.state || '—'}
                              </span>
                            </div>
                            <div className="flex mb-5 justify-between items-center">
                              <span className="text-muted-foreground text-sm">
                                {isVendor ? 'ITC from purchases' : 'GST invoiced'}
                              </span>
                              <span className="font-medium text-sm">
                                {formatINR(taxCredited)}
                              </span>
                            </div>
                            <div className="border-x border-t border-b flex pt-4 justify-between items-center">
                              <Label htmlFor="include-reports">
                                Include in GST reports
                              </Label>
                              <label title="This contact is included in GST reports automatically whenever an invoice naming it carries GST data — the control is informational in this release.">
                                <Switch
                                  id="include-reports"
                                  defaultChecked={relatedInvoices.some((i) => gstOf(i) > 0)}
                                  disabled
                                />
                              </label>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                      <Card>
                        <CardHeader>
                          <CardTitle>Notes</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="rounded-md bg-muted mb-5 p-4">
                            <div className="flex justify-between items-center">
                              <p className="font-medium text-sm">Notes storage</p>
                            </div>
                            <p className="text-muted-foreground text-sm mt-2">
                              DIGITAX does not store free-text contact notes yet. Track filing-relevant
                              remarks on the invoice itself, where they flow into the GST engine.
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Input
                              placeholder="Add a note..."
                              disabled
                              title="Free-text contact notes are not stored yet — DIGITAX keeps notes on invoices instead."
                              aria-disabled
                            />
                            <Button disabled>Save note</Button>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="transactions" className="mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>
                            Statements matching {displayName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {relatedTransactions.length === 0 ? (
                            <div className="py-6 text-center">
                              <p className="font-medium">No matching transactions</p>
                              <p className="text-muted-foreground text-sm mt-1">
                                Bank movements whose description names this contact appear here.
                              </p>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Date</TableHead>
                                  <TableHead>Description</TableHead>
                                  <TableHead className="text-right">Amount</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {relatedTransactions.slice(0, 10).map((t) => (
                                  <TableRow key={t.id}>
                                    <TableCell>{fmtDate(t.transaction_date || null)}</TableCell>
                                    <TableCell>{t.description}</TableCell>
                                    <TableCell
                                      className={
                                        t.direction === 'credit' ? 'text-primary text-right' : 'text-right'
                                      }
                                    >
                                      {t.direction === 'credit' ? '+' : '-'}
                                      {formatINR(t.amount)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          t.reconciliation_status === 'matched'
                                            ? 'secondary'
                                            : 'outline'
                                        }
                                      >
                                        {t.reconciliation_status === 'matched'
                                          ? 'Matched'
                                          : 'Needs review'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                    <TabsContent value="documents" className="mb-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Invoices for this contact</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {relatedInvoices.length === 0 ? (
                            <div className="py-6 text-center">
                              <p className="font-medium">No invoices recorded</p>
                              <p className="text-muted-foreground text-sm mt-1">
                                Record an invoice naming this contact to build the history.
                              </p>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Invoice</TableHead>
                                  <TableHead>Date</TableHead>
                                  <TableHead className="text-right">Open balance</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {relatedInvoices.map((inv) => (
                                  <TableRow key={inv.id}>
                                    <TableCell>{inv.invoice_number}</TableCell>
                                    <TableCell>{fmtDate(inv.invoice_date)}</TableCell>
                                    <TableCell className="text-right">
                                      {formatINR(
                                        (inv.payment_status || 'unpaid') === 'paid'
                                          ? '0'
                                          : inv.outstanding_balance ?? inv.amount_due
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <Badge
                                        variant={
                                          (inv.payment_status || 'unpaid') === 'paid'
                                            ? 'secondary'
                                            : 'outline'
                                        }
                                      >
                                        {(inv.payment_status || 'unpaid') === 'paid'
                                          ? 'Paid'
                                          : 'Open'}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                  <p className="text-muted-foreground text-xs mt-4">
                    Live data · derived only from this business&apos;s own invoices and imported statements.
                  </p>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VendorProfile() {
  return (
    <Suspense fallback={
      <div className="bg-background text-foreground min-h-screen flex items-center justify-center">
        <p className="font-medium text-muted-foreground">Loading contact…</p>
      </div>
    }>
      <ProfileContent />
    </Suspense>
  );
}

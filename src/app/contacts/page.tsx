'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
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
  Plus,
  ReceiptText,
  Search,
  SearchX,
  Settings,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';
import { formatINR } from '@/lib/decimal';

interface InvoiceShape {
  id: string;
  supplier_name?: string | null;
  supplier_gstin?: string | null;
  buyer_name?: string | null;
  buyer_gstin?: string | null;
  amount_due: string;
  outstanding_balance?: string;
  payment_status?: string;
  total_amount: string;
  invoice_date: string;
  created_at?: string;
  direction: string;
  invoice_type: string;
}

interface DerivedContact {
  name: string;
  gstin: string | null;
  kind: 'Customer' | 'Vendor';
  openBalance: number;
  lastActivity: string | null; // ISO
  invoices: number;
}

const AVATAR_STYLES = [
  'bg-primary/15 text-primary',
  'bg-accent text-accent-foreground',
  'bg-secondary text-secondary-foreground',
  'bg-primary/10 text-primary',
];

function contactInitials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '??';
  if (parts.length === 1) return name.slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

const PAGE_SIZE = 6;

export default function Contacts() {
  const router = useRouter();
  const {
    shop,
    loading: ctxLoading,
    error: ctxError,
    needsOnboarding,
    userEmail,
    refresh,
  } = useShopContext();
  const [invoices, setInvoices] = useState<InvoiceShape[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [tab, setTab] = useState('customers');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
    setInvoices(null);
    setDataError(null);
      try {
        const res = await fetch('/api/invoices?limit=100', { cache: 'no-store' });
        if (cancelled) return;
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setDataError(data?.error || `Could not load invoices (HTTP ${res.status}).`);
          setInvoices([]);
          return;
        }
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      } catch {
        if (!cancelled) {
          setDataError('Network error while loading contacts.');
          setInvoices([]);
        }
      }
    }
    if (!ctxLoading) load();
    return () => {
      cancelled = true;
    };
  }, [ctxLoading, shop?.id]);

  // Contacts are derived — DIGITAX has no separate contacts table; a contact
  // exists if this business has an invoice naming that counterparty.
  const contacts = useMemo<Array<DerivedContact>>(() => {
    type Entry = {
      name: string;
      gstin: string | null;
      kind: 'Customer' | 'Vendor';
      open: number;
      last: string | null;
      count: number;
    };
    const map = new Map<string, Entry>();
    for (const inv of invoices || []) {
      const isPurchase =
        inv.direction === 'purchase' || inv.invoice_type === 'purchase_tax_invoice';
      const name = (isPurchase ? inv.supplier_name : inv.buyer_name) || '';
      if (!name || !name.trim()) continue;
      const key = `${isPurchase ? 'vendor' : 'customer'}:${name.trim().toLowerCase()}`;
      const existing = map.get(key);
      const entry: Entry = existing || {
        name: name.trim(),
        gstin: (isPurchase ? inv.supplier_gstin : inv.buyer_gstin) ?? null,
        kind: isPurchase ? 'Vendor' : 'Customer',
        open: 0,
        last: null,
        count: 0,
      };
      const status = inv.payment_status || 'unpaid';
      if (status !== 'paid') {
        const bal = inv.outstanding_balance ?? inv.amount_due ?? '0';
        entry.open += parseFloat((bal || '0').toString().replace(/,/g, '')) || 0;
      }
      entry.count += 1;
      const d = inv.invoice_date || inv.created_at || null;
      if (d && (!entry.last || new Date(d) > new Date(entry.last))) entry.last = d;
      if (!entry.gstin && (isPurchase ? inv.supplier_gstin : inv.buyer_gstin)) {
        entry.gstin = (isPurchase ? inv.supplier_gstin : inv.buyer_gstin) ?? null;
      }
      map.set(key, entry);
    }
    return Array.from(map.values()).map((e) => ({
      name: e.name,
      gstin: e.gstin,
      kind: e.kind,
      openBalance: e.open,
      lastActivity: e.last,
      invoices: e.count,
    }));
  }, [invoices]);

  const customers = useMemo(() => contacts.filter((c) => c.kind === 'Customer'), [contacts]);
  const vendors = useMemo(() => contacts.filter((c) => c.kind === 'Vendor'), [contacts]);
  const needsAttention = useMemo(
    () => contacts.filter((c) => !c.gstin).length,
    [contacts]
  );

  const visible = useMemo(
    () => (tab === 'vendors' ? vendors : customers),
    [tab, customers, vendors]
  );

  const filtered = useMemo(() => {
    let rows = visible;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter((c) => c.name.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') {
      rows = rows.filter((c) => (statusFilter === 'review' ? !c.gstin : Boolean(c.gstin)));
    }
    return rows;
  }, [visible, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  React.useEffect(() => {
    let cancelled = false;
    async function clamp() {
      await Promise.resolve();
      if (cancelled) return;
      if (page >= pageCount) setPage(0);
    }
    clamp();
    return () => {
      cancelled = true;
    };
  }, [pageCount, page]);

  const fmtDate = (iso: string | null) => {
    if (!iso) return 'No activity yet';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return 'No activity yet';
    return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
  };

  // Insight bars keep the approved visual, driven by real counts.
  const maxInsight = Math.max(customers.length, vendors.length, needsAttention, 1);

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
              <span className="font-medium text-foreground">Contacts</span>
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
          <main className="px-8 pt-24 pb-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-semibold text-2xl tracking-tight">
                  Contacts
                </h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Customers and vendors, in one trusted place.
                </p>
              </div>
              <Button
                className="gap-2 h-10"
                disabled
                title="Contacts are derived automatically from your business's invoices — record the counterparty on the invoice and the contact appears here."
              >
                <Plus className="size-4" />
                Add contact
              </Button>
            </div>
            <div className="flex mt-8 justify-between items-center gap-4">
              <Tabs
                value={tab}
                onValueChange={(v) => {
                  setTab(v);
                  setPage(0);
                }}
              >
                <TabsList>
                  <TabsTrigger value="customers">
                    Customers ({customers.length})
                  </TabsTrigger>
                  <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-3">
                <label className="rounded-md bg-card border border-input flex px-3 items-center gap-2 w-64 h-10">
                  <Search className="text-muted-foreground size-4" />
                  <input
                    placeholder="Search contacts"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(0);
                    }}
                    className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                  />
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => {
                    setStatusFilter(v);
                    setPage(0);
                  }}
                >
                  <SelectTrigger className="w-40 h-10">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="review">Review needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid mt-6 gap-6 grid-cols-[minmax(0,1fr)_256px]">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  {ctxError || dataError ? (
                    <div className="px-6 py-10 text-center">
                      <SearchX className="text-muted-foreground size-8 mx-auto" />
                      <p className="font-medium mt-3">
                        {ctxError ? 'Could not load your business context.' : dataError}
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Contacts are shown only from your business&apos;s own invoices.
                      </p>
                      <Button className="mt-4 h-9" onClick={() => refresh()}>
                        Retry
                      </Button>
                    </div>
                  ) : ctxLoading || invoices === null ? (
                    <div className="px-6 py-10 text-center">
                      <p className="font-medium text-muted-foreground">Loading contacts…</p>
                    </div>
                  ) : needsOnboarding ? (
                    <div className="px-6 py-10 text-center">
                      <Building2 className="text-muted-foreground size-8 mx-auto" />
                      <p className="font-medium mt-3">No business yet</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Complete onboarding to build your customer and vendor list.
                      </p>
                      <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                        Set up business
                      </Button>
                    </div>
                  ) : (
                    <>
                      {currentRows.length === 0 && needsOnboarding === false && (
                        <div className="border-x border-t border-b flex justify-center items-center min-h-48">
                          <div className="text-center">
                            <p className="font-medium">No contacts found</p>
                            <p className="text-muted-foreground text-sm mt-1">
                              {search
                                ? 'Try adjusting your search or status filter.'
                                : 'Record an invoice naming the counterparty and the contact appears here.'}
                            </p>
                          </div>
                        </div>
                      )}
                      {currentRows.length > 0 && (
                        <table className="text-left text-sm w-full">
                          <thead className="bg-muted border-t border-r border-b border-b-border border-l-border">
                            <tr>
                              <th className="font-medium text-muted-foreground px-6 py-3">
                                Name
                              </th>
                              <th className="font-medium text-muted-foreground px-4 py-3">
                                Type
                              </th>
                              <th className="font-medium text-muted-foreground px-4 py-3">
                                GSTIN
                              </th>
                              <th className="font-medium text-muted-foreground px-4 py-3">
                                Open balance
                              </th>
                              <th className="font-medium text-muted-foreground px-4 py-3">
                                Last activity
                              </th>
                              <th className="font-medium text-muted-foreground px-4 py-3">
                                Status
                              </th>
                              <th className="px-4 py-3" />
                            </tr>
                          </thead>
                          <tbody>
                            {currentRows.map((c, i) => (
                              <tr
                                key={`${c.kind}-${c.name}`}
                                className="border-t border-r border-b border-b-border border-l-border cursor-pointer hover:bg-accent/40"
                                onClick={() =>
                                  router.push(
                                    `/contacts/vendor-profile?name=${encodeURIComponent(c.name)}&kind=${c.kind.toLowerCase()}`
                                  )
                                }
                                title="Open contact profile"
                              >
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <Avatar className={`${AVATAR_STYLES[i % AVATAR_STYLES.length]} size-9`}>
                                      <AvatarFallback
                                        className={`${AVATAR_STYLES[i % AVATAR_STYLES.length]}`}
                                      >
                                        {contactInitials(c.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{c.name}</span>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <Badge variant="secondary">{c.kind}</Badge>
                                </td>
                                <td className="font-mono text-muted-foreground text-xs p-4">
                                  {c.gstin || 'Missing — review invoice'}
                                </td>
                                <td className="p-4">{formatINR(c.openBalance)}</td>
                                <td className="text-muted-foreground p-4">
                                  {fmtDate(c.lastActivity)}
                                </td>
                                <td className="p-4">
                                  {c.gstin ? (
                                    <Badge className="bg-primary/10 text-primary">
                                      Active
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-chart-3/15 text-foreground">
                                      Review needed
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-4">
                                  <ChevronRight className="text-muted-foreground size-4" />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </>
                  )}
                </div>
                <div className="border-x border-t border-b flex px-6 py-4 justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    {filtered.length} contact{filtered.length === 1 ? '' : 's'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      aria-label="Previous contacts"
                    >
                      <ChevronRight className="size-4 rotate-180" />
                    </Button>
                    <Button variant="secondary" size="icon" aria-label={`Page ${page + 1}`}>
                      {page + 1}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={page + 1 >= pageCount}
                      onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                      aria-label="Next contacts"
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="border-x border-t border-b px-6 py-2">
                  <span className="text-muted-foreground text-xs">
                    Live data · contacts derived from this business&apos;s invoices
                  </span>
                </div>
              </Card>
              <Card className="p-6 h-fit">
                <h2 className="font-semibold">Contact insights</h2>
                <div className="flex mt-6 flex-col gap-5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Customers
                    </span>
                    <span className="font-semibold">{customers.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Vendors
                    </span>
                    <span className="font-semibold">{vendors.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Needs attention
                    </span>
                    <span className="font-semibold text-destructive">{needsAttention}</span>
                  </div>
                  <div className="flex mt-2 items-end gap-3 h-24">
                    <div className="rounded-xs bg-primary/15 flex-1 h-full">
                      <div
                        className="rounded-xs bg-primary"
                        style={{ height: `${Math.round((customers.length / maxInsight) * 100)}%` }}
                      />
                    </div>
                    <div className="rounded-xs bg-chart-2/15 flex-1 h-full">
                      <div
                        className="rounded-xs bg-chart-2"
                        style={{ height: `${Math.round((vendors.length / maxInsight) * 100)}%` }}
                      />
                    </div>
                    <div className="rounded-xs bg-chart-3/15 flex-1 h-full">
                      <div
                        className="rounded-xs bg-chart-3"
                        style={{
                          height: `${Math.round((needsAttention / maxInsight) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

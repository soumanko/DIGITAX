'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
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
  RotateCcw,
  Search,
  SearchX,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';
import { formatINR } from '@/lib/decimal';

interface LedgerTransaction {
  id: string;
  description?: string;
  source?: string;
  source_account?: string;
  bank_account_name?: string;
  transaction_date?: string;
  direction: string;
  amount: string;
  category?: string | null;
  sub_category?: string | null;
  reconciliation_status: string;
}

const PAGE_SIZE = 6;

export default function Transactions() {
  const router = useRouter();
  const { shop, loading: ctxLoading, error: ctxError, needsOnboarding, userEmail, refresh } = useShopContext();
  const [transactions, setTransactions] = useState<LedgerTransaction[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [page, setPage] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
    setTransactions(null);
    setDataError(null);
      try {
        const res = await fetch('/api/transactions?limit=100', { cache: 'no-store' });
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          setDataError(body?.error || `Could not load transactions (HTTP ${res.status}).`);
          setTransactions([]);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      } catch {
        if (!cancelled) {
          setDataError('Network error while loading transactions.');
          setTransactions([]);
        }
      }
    }
    if (!ctxLoading) load();
    return () => {
      cancelled = true;
    };
  }, [ctxLoading, shop?.id]);

  const accounts = useMemo(
    () => Array.from(new Set((transactions || []).map((t) => t.bank_account_name || t.source_account || '').filter(Boolean))),
    [transactions]
  );
  const categories = useMemo(
    () => Array.from(new Set((transactions || []).map((t) => t.category || '').filter(Boolean))),
    [transactions]
  );
  const periods = useMemo(
    () =>
      Array.from(
        new Set(
          (transactions || []).map((t) => {
            const d = t.transaction_date ? new Date(t.transaction_date) : null;
            return d && !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : '';
          }).filter(Boolean)
        )
      ).sort().reverse(),
    [transactions]
  );

  const filtered = useMemo(() => {
    let rows = transactions || [];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      rows = rows.filter(
        (t) =>
          (t.description || '').toLowerCase().includes(q) ||
          String(t.amount || '').includes(q.replace(/[₹,]/g, ''))
      );
    }
    if (accountFilter !== 'all') rows = rows.filter((t) => (t.bank_account_name || t.source_account || '') === accountFilter);
    if (categoryFilter !== 'all') rows = rows.filter((t) => (t.category || '') === categoryFilter);
    if (periodFilter !== 'all') {
      rows = rows.filter((t) => {
        const d = t.transaction_date ? new Date(t.transaction_date) : null;
        const key = d && !isNaN(d.getTime()) ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` : '';
        return key === periodFilter;
      });
    }
    return rows;
  }, [transactions, search, accountFilter, categoryFilter, periodFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentRows = filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : page * PAGE_SIZE + 1;
  const rangeEnd = Math.min(filtered.length, (page + 1) * PAGE_SIZE);
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

  const fmtDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-IN', { month: 'short' })}`;
  };

  const statusBadge = (status: string) => {
    if (status === 'matched') {
      return <Badge className="bg-primary/10 text-primary">Matched</Badge>;
    }
    if (status === 'partially_matched') {
      return <Badge className="bg-accent text-accent-foreground">Partial</Badge>;
    }
    return (
      <Badge variant="outline" className="text-destructive border-destructive/50">
        Needs review
      </Badge>
    );
  };

  const periodLabel = (key: string) => {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
  };

  return (
    <div data-appearance="light">
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
            <Link
              href="/dashboard"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </Link>
            <Link
              href="/transactions"
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
            >
              <ArrowLeftRight className="size-4" />
              <span>Transactions</span>
            </Link>
            <Link
              href="/gst"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <ReceiptText className="size-4" />
              <span>{`GST & Tax`}</span>
            </Link>
            <Link
              href="/banking"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Landmark className="size-4" />
              <span>Banking</span>
            </Link>
            <Link
              href="/reports"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <BarChart3 className="size-4" />
              <span>Reports</span>
            </Link>
            <Link
              href="/contacts"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Users className="size-4" />
              <span>Contacts</span>
            </Link>
            <Link
              href="/settings"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </Link>
          </nav>
          <div className="border-x border-t border-b flex pt-4 flex-col gap-2">
            <Link
              href="/dashboard"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <CircleHelp className="size-4" />
              <span>{`Help & support`}</span>
            </Link>
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
              <span className="font-medium text-foreground">
                Transactions
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
          <main className="px-8 pt-24 pb-8">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-semibold text-2xl tracking-tight">
                  Transactions
                </h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Review, categorize, and reconcile every business movement.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="h-9"
                  onClick={() => router.push('/expense-capture')}
                >
                  Add transaction
                </Button>
                <Button variant="secondary" className="h-9" onClick={() => router.push('/expense-capture')}>
                  Import
                </Button>
              </div>
            </div>
            <div className="rounded-md bg-card border border-border flex mt-8 p-3 items-center gap-3">
              <label className="rounded-md bg-background border border-input flex px-3 items-center gap-2 h-9 min-w-72">
                <Search className="text-muted-foreground size-4" />
                <input
                  type="search"
                  placeholder="Search by merchant or amount"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                />
              </label>
              <Select
                value={accountFilter}
                onValueChange={(v) => { setAccountFilter(v); setPage(0); }}
              >
                <SelectTrigger className="w-48 h-9">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a} value={a} className="max-w-48">
                      <span className="truncate block">{a}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={categoryFilter}
                onValueChange={(v) => { setCategoryFilter(v); setPage(0); }}
              >
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c} className="max-w-44">
                      <span className="truncate block">{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={periodFilter}
                onValueChange={(v) => { setPeriodFilter(v); setPage(0); }}
              >
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="All periods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All periods</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p} value={p}>
                      {periodLabel(p)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="secondary" className="ml-auto gap-2 h-9">
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>
            </div>

            {ctxError || dataError ? (
              <Card className="mt-6">
                <div className="p-10 text-center">
                  <SearchX className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">
                    {ctxError ? 'Could not load your business context.' : dataError}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Nothing inaccurate is being shown — the ledger is simply unavailable right now.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => refresh()}>
                    Retry
                  </Button>
                </div>
              </Card>
            ) : ctxLoading || transactions === null ? (
              <Card className="mt-6 overflow-hidden">
                <div className="p-10 text-center">
                  <p className="font-medium text-muted-foreground">Loading transactions…</p>
                </div>
              </Card>
            ) : needsOnboarding ? (
              <Card className="mt-6">
                <div className="p-10 text-center">
                  <Building2 className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">No business yet</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Complete onboarding to start recording transactions for your business.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                    Set up business
                  </Button>
                </div>
              </Card>
            ) : currentRows.length === 0 ? (
              <Card className="mt-6">
                <div className="p-10 text-center">
                  <SearchX className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">
                    {filtered.length === 0 && search ? 'No transactions match your filters' : 'No transactions yet'}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Import your bank statement to get started.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => router.push('/expense-capture')}>
                    Import statement
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="mt-6 overflow-hidden">
                <div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentRows.map((t) => {
                        const isCredit = t.direction === 'credit';
                        const isRefund = (t.sub_category || '').toLowerCase().includes('refund');
                        return (
                          <TableRow key={t.id}>
                            <TableCell className="text-sm">{fmtDate(t.transaction_date)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <span
                                  className={
                                    isCredit
                                      ? 'rounded-md bg-primary/10 text-primary flex justify-center items-center size-8'
                                      : 'rounded-md bg-muted text-muted-foreground flex justify-center items-center size-8'
                                  }
                                >
                                  {isRefund ? <RotateCcw className="size-4" /> : isCredit ? <ArrowDownToLine className="size-4" /> : <ArrowUpFromLine className="size-4" />}
                                </span>
                                <span className="font-medium">{t.description || 'Transaction'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {(t.category || 'other').charAt(0).toUpperCase() + (t.category || 'other').slice(1)}
                            </TableCell>
                            <TableCell>{t.bank_account_name || t.source_account || '—'}</TableCell>
                            <TableCell className={`font-medium text-right ${isCredit ? 'text-primary' : ''}`}>
                              {isCredit ? '+' : '−'}
                              {formatINR(t.amount)}
                            </TableCell>
                            <TableCell>{statusBadge(t.reconciliation_status)}</TableCell>
                            <TableCell>
                              <button
                                aria-label="More options"
                                className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                              >
                                <MoreHorizontal className="size-4" />
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <div className="border-x border-t border-b flex px-6 py-4 justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Showing {rangeStart}–{rangeEnd} of {filtered.length} transactions
                    </span>
                    <div className="flex items-center gap-1">
                      {pageCount > 1 && (
                        <Button
                          variant="ghost"
                          className="px-3 gap-1 h-8"
                          disabled={page === 0}
                          onClick={() => setPage((p) => Math.max(0, p - 1))}
                        >
                          Previous
                        </Button>
                      )}
                      <Button className="p-0 size-8">{page + 1}</Button>
                      {page + 1 < pageCount && (
                        <Button variant="ghost" className="px-3 gap-1 h-8" onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}>
                          Next
                          <ChevronRight className="size-4" />
                        </Button>
                      )}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Live data · synced from your business records
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

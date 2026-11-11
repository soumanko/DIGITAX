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
  ReceiptText,
  Search,
  Settings,
  Users,
  Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface DerivedAccount {
  name: string;
  sourceKind: string; // e.g. bank_csv, upi_qr, manual
  isManual: boolean;
  balance: number; // net credit − debit, computed from recorded movements
  movements: number;
  lastActivity: string | null; // ISO
}

export default function Banking() {
  const router = useRouter();
  const {
    shop,
    loading: ctxLoading,
    error: ctxError,
    needsOnboarding,
    userEmail,
    refresh,
  } = useShopContext();
  const [transactions, setTransactions] = useState<LedgerTransaction[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [accountFilter, setAccountFilter] = useState('all');

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
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setDataError(data?.error || `Could not load transactions (HTTP ${res.status}).`);
          setTransactions([]);
          return;
        }
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

  // Derive real accounts from the ledger: group by bank_account_name / source_account.
  const accounts = useMemo<DerivedAccount[]>(() => {
    const map = new Map<
      string,
      { sourceKind: string; balance: number; movements: number; last: string | null }
    >();
    for (const t of transactions || []) {
      const name = t.bank_account_name || t.source_account || 'Unattributed';
      const entry = map.get(name) || {
        sourceKind: t.source || '',
        balance: 0,
        movements: 0,
        last: null,
      };
      const amt = parseFloat((t.amount || '0').toString().replace(/,/g, '')) || 0;
      entry.balance += t.direction === 'credit' ? amt : -amt;
      entry.movements += 1;
      const d = t.transaction_date ? new Date(t.transaction_date) : null;
      if (d && !isNaN(d.getTime()) && (!entry.last || d > new Date(entry.last))) {
        entry.last = t.transaction_date!;
      }
      if (t.source && !entry.sourceKind) entry.sourceKind = t.source;
      map.set(name, entry);
    }
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        sourceKind: v.sourceKind,
        isManual: (v.sourceKind || '').startsWith('manual'),
        balance: v.balance,
        movements: v.movements,
        lastActivity: v.last,
      }))
      .sort((a, b) => b.movements - a.movements);
  }, [transactions]);

  const matchedCount = (transactions || []).filter(
    (t) => t.reconciliation_status === 'matched'
  ).length;
  const totalCount = (transactions || []).length;
  const needsReviewCount = totalCount - matchedCount;
  const uncategorisedCount = (transactions || []).filter((t) => !t.category).length;
  const healthPercent =
    totalCount > 0 ? Math.round((matchedCount / totalCount) * 100) : null;

  const activityRows = useMemo(() => {
    let rows = transactions || [];
    if (accountFilter !== 'all') {
      rows = rows.filter((t) => (t.bank_account_name || t.source_account || '') === accountFilter);
    }
    return rows.slice(0, 5);
  }, [transactions, accountFilter]);

  const fmtDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
  };

  const lastActivityLabel = (acc: DerivedAccount) => {
    if (acc.lastActivity) return `Last activity ${fmtDate(acc.lastActivity)}`;
    return 'No recorded movements yet';
  };

  const sourceLabel = (kind: string) => {
    const map: Record<string, string> = {
      bank_csv: 'Imported statement',
      upi_qr: 'UPI settlement',
      manual: 'Manual entry',
    };
    return map[kind] || 'Imported movements';
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
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/contacts')}
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
              <span className="font-medium text-foreground">Banking</span>
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
                  Banking
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Connect accounts and keep your books in sync.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/expense-capture')}
                >
                  Upload statement
                </Button>
                <Button
                  variant="outline"
                  disabled
                  title="Direct bank feed connections are not integrated in this release — import a statement CSV from the Transactions flow instead."
                >
                  Connect account
                </Button>
              </div>
            </div>

            {ctxError || dataError ? (
              <Card className="mt-8">
                <div className="p-10 text-center">
                  <Landmark className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">
                    {ctxError ? 'Could not load your business context.' : dataError}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Account figures are never shown from another business or a sample source.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => refresh()}>
                    Retry
                  </Button>
                </div>
              </Card>
            ) : ctxLoading || transactions === null ? (
              <Card className="mt-8">
                <div className="p-10 text-center">
                  <p className="font-medium text-muted-foreground">Loading your accounts…</p>
                </div>
              </Card>
            ) : needsOnboarding ? (
              <Card className="mt-8">
                <div className="p-10 text-center">
                  <Building2 className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">No business yet</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Complete onboarding to track accounts and statements for your business.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                    Set up business
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid mt-8 gap-6 grid-cols-5">
                  <Card className="col-span-3">
                    <CardHeader className="flex flex-row justify-between items-center">
                      <CardTitle className="mb-0">Imported accounts</CardTitle>
                      <Badge variant="secondary">
                        {accounts.length} account{accounts.length === 1 ? '' : 's'}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-0">
                      {accounts.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                          <Wallet className="text-muted-foreground size-8 mx-auto" />
                          <p className="font-medium mt-3">No accounts recorded yet</p>
                          <p className="text-muted-foreground text-sm mt-1">
                            Import a bank statement for your business and these accounts appear
                            automatically from its ledger.
                          </p>
                        </div>
                      ) : (
                        accounts.slice(0, 3).map((acc) => (
                          <div
                            key={acc.name}
                            className="border-x border-t border-b flex px-6 py-5 items-center gap-4"
                          >
                            <div
                              className={
                                acc.isManual
                                  ? 'rounded-md bg-muted text-muted-foreground flex justify-center items-center size-10'
                                  : 'rounded-md bg-accent text-accent-foreground flex justify-center items-center size-10'
                              }
                            >
                              {acc.isManual ? <Wallet className="size-5" /> : <Building2 className="size-5" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{acc.name}</p>
                              <p className="text-muted-foreground text-xs mt-1">
                                {sourceLabel(acc.sourceKind)} · {lastActivityLabel(acc)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-sm">{formatINR(acc.balance)}</p>
                              <Badge
                                className={
                                  acc.isManual
                                    ? 'mt-1'
                                    : 'bg-primary/10 text-primary mt-1'
                                }
                                variant={acc.isManual ? 'secondary' : undefined}
                              >
                                {acc.isManual ? 'Manual' : 'Imported'}
                              </Badge>
                            </div>
                            <button
                              aria-label={`More options for ${acc.name}`}
                              className="rounded-md text-muted-foreground p-2 hover:bg-accent hover:text-foreground"
                              title={`${acc.movements} recorded movement${acc.movements === 1 ? '' : 's'} in this account`}
                            >
                              <MoreHorizontal className="size-4" />
                            </button>
                          </div>
                        ))
                      )}
                      {accounts.length > 3 && (
                        <div className="border-x border-t border-b px-6 py-3">
                          <span className="text-muted-foreground text-xs">
                            Showing 3 of {accounts.length} accounts derived from your ledger
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  <Card className="col-span-2">
                    <CardHeader>
                      <CardTitle>Reconciliation health</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-end gap-3">
                        <span className="font-semibold text-5xl tracking-tight">
                          {healthPercent === null ? '—' : `${healthPercent}%`}
                        </span>
                        <span className="text-muted-foreground text-sm pb-2">
                          {totalCount === 0
                            ? 'No transactions recorded yet'
                            : `${matchedCount} of ${totalCount} transactions matched`}
                        </span>
                      </div>
                      <div className="rounded-full bg-muted mt-6 w-full h-2 overflow-hidden">
                        <div
                          className="rounded-full bg-primary h-full"
                          style={{ width: `${healthPercent ?? 0}%` }}
                        />
                      </div>
                      <div className="grid mt-6 gap-4 grid-cols-3">
                        <div>
                          <p className="font-semibold text-2xl">{matchedCount}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Matched
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-2xl">{needsReviewCount}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Needs review
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold text-2xl">{uncategorisedCount}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Uncategorised
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="mt-7 w-full"
                        onClick={() => router.push('/reconciliation')}
                      >
                        Review exceptions
                      </Button>
                    </CardContent>
                  </Card>
                </div>
                <Card className="mt-6">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle className="mb-0">Recent bank activity</CardTitle>
                    <Select
                      value={accountFilter}
                      onValueChange={(v) => setAccountFilter(v)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="All accounts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All accounts</SelectItem>
                        {accounts.map((a) => (
                          <SelectItem key={a.name} value={a.name} className="max-w-40">
                            <span className="truncate block">{a.name}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardHeader>
                  <CardContent>
                    {activityRows.length === 0 ? (
                      <div className="rounded-md text-muted-foreground text-sm border border-dashed border-border flex mt-1 justify-center items-center h-20">
                        {accountFilter !== 'all'
                          ? 'No recorded movements for this account yet'
                          : 'No transactions recorded for this business yet'}
                      </div>
                    ) : (
                      <div className="rounded-md border border-border overflow-hidden">
                        <table className="text-sm w-full">
                          <thead>
                            <tr className="text-left bg-muted text-muted-foreground text-xs">
                              <th className="font-medium px-4 py-3">Date</th>
                              <th className="font-medium px-4 py-3">Account</th>
                              <th className="font-medium px-4 py-3">Description</th>
                              <th className="font-medium text-right px-4 py-3">
                                Amount
                              </th>
                              <th className="font-medium px-4 py-3">
                                Match status
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {activityRows.map((t) => {
                              const isCredit = t.direction === 'credit';
                              const isMatched = t.reconciliation_status === 'matched';
                              const isPartial = t.reconciliation_status === 'partially_matched';
                              return (
                                <tr key={t.id} className="border-x border-t border-b">
                                  <td className="text-muted-foreground px-4 py-3">
                                    {fmtDate(t.transaction_date)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {t.bank_account_name || t.source_account || '—'}
                                  </td>
                                  <td className="px-4 py-3">{t.description || 'Transaction'}</td>
                                  <td
                                    className={`font-medium text-right px-4 py-3 ${isCredit ? 'text-primary' : ''}`}
                                  >
                                    {isCredit ? '+' : '-'}
                                    {formatINR(t.amount)}
                                  </td>
                                  <td className="px-4 py-3">
                                    {isMatched ? (
                                      <Badge className="bg-primary/10 text-primary">
                                        Matched
                                      </Badge>
                                    ) : isPartial ? (
                                      <Badge variant="outline">Partial</Badge>
                                    ) : (
                                      <Badge variant="outline">Needs review</Badge>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div
                      className="rounded-md text-muted-foreground text-sm border border-dashed border-border flex mt-6 justify-center items-center h-20 cursor-pointer hover:bg-accent/40"
                      onClick={() => router.push('/expense-capture')}
                      title="Opens the statement importer for your business"
                    >
                      Drop a CSV or bank statement here to import
                    </div>
                    <p className="text-muted-foreground text-xs mt-3">
                      Live data · derived from this business&apos;s imported statements and ledger
                    </p>
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

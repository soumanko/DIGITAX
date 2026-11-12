'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Landmark,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { money, formatINR, Decimal } from '@/lib/decimal';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface DashboardShop {
  id: string;
  name: string;
  owner_name?: string;
  gstin?: string | null;
}

interface DashboardInvoice {
  id: string;
  invoice_number: string;
  direction: string;
  invoice_date: string;
  total_amount: string;
  cgst_amount?: string;
  cgst_total?: string;
  sgst_amount?: string;
  sgst_total?: string;
  igst_amount?: string;
  igst_total?: string;
  review_state: string;
}

interface DashboardTransaction {
  id: string;
  description?: string;
  source?: string;
  transaction_date?: string;
  amount: string;
  direction: string;
  reconciliation_status: string;
}

export default function ExecutiveOverview() {
  const router = useRouter();
  const [shop, setShop] = useState<DashboardShop | null>(null);
  const [invoices, setInvoices] = useState<DashboardInvoice[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<Date | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);
  const [accountPanel, setAccountPanel] = useState<'sidebar' | 'header' | null>(null);
  const [deleteStage, setDeleteStage] = useState<'idle' | 'confirm'>('idle');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        setToday(new Date());
        const [shopRes, invRes, txnRes] = await Promise.all([
          fetch('/api/shops'),
          fetch('/api/invoices?limit=100'),
          fetch('/api/transactions?limit=100'),
        ]);

        if (shopRes.ok) {
          const shopData = await shopRes.json();
          setShop(shopData.shop || null);
        }

        if (invRes.ok) {
          const invData = await invRes.json();
          setInvoices(Array.isArray(invData.invoices) ? invData.invoices : []);
        }

        if (txnRes.ok) {
          const txnData = await txnRes.json();
          setTransactions(Array.isArray(txnData.transactions) ? txnData.transactions : []);
        }

        // Real signed-in user identity for the account options menu
        try {
          const supabase = createClient();
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.email) setOwnerEmail(userData.user.email);
        } catch {
          // Account panel falls back to generic identity text
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  async function handleLogout() {
    setAccountPanel(null);
    try {
      await fetch('/api/auth/signout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
    } catch {
      // Fall through — the refresh below still ends the client session, and
      // middleware fail-closes on any stale cookie.
    }
    router.push('/login');
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (deletingAccount || deleteConfirmText !== 'DELETE') return;
    setDeletingAccount(true);
    setAccountError(null);
    try {
      const res = await fetch('/api/auth/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation: deleteConfirmText }),
      });
      if (res.ok) {
        // Account and business data were deleted server-side. Leave this
        // browser with no residual session state.
        router.push('/register');
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => ({}));
      setAccountError(
        data.error || `The server could not delete the account (HTTP ${res.status}). Nothing was removed.`
      );
    } catch {
      setAccountError('Network error during account deletion. Nothing was removed — please try again.');
    } finally {
      setDeletingAccount(false);
    }
  }

  function openDeleteConfirmation() {
    setDeleteStage('confirm');
    setDeleteConfirmText('');
    setAccountError(null);
  }

  function closeAccountPanel() {
    setAccountPanel(null);
    setDeleteStage('idle');
    setDeleteConfirmText('');
    setAccountError(null);
  }

  if (loading || !today) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary-600 items-center justify-center text-white font-bold text-xl mb-3 shadow-md">
            D
          </div>
          <p className="text-sm text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 rounded-xl bg-error-600 items-center justify-center text-white font-bold text-xl mb-3 shadow-md">
            !
          </div>
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      </div>
    );
  }

  // Compute KPIs from real data
  const salesInvoices = invoices.filter((i: DashboardInvoice) => i.direction === 'sales');
  const purchaseInvoices = invoices.filter((i: DashboardInvoice) => i.direction === 'purchase');

  const totalRevenue = salesInvoices.reduce((acc, inv) => acc.plus(money(inv.total_amount || '0')), money(0));
  const totalExpenses = purchaseInvoices.reduce((acc, inv) => acc.plus(money(inv.total_amount || '0')), money(0));

  // GST liability from sales invoices (CGST + SGST + IGST)
  const gstLiability = salesInvoices.reduce((acc, inv) => {
    const cgst = money(inv.cgst_amount || inv.cgst_total || '0');
    const sgst = money(inv.sgst_amount || inv.sgst_total || '0');
    const igst = money(inv.igst_amount || inv.igst_total || '0');
    return acc.plus(cgst).plus(sgst).plus(igst);
  }, money(0));

  // Cash balance from credit transactions minus debits
  const creditTxs = transactions.filter((t: DashboardTransaction) => t.direction === 'credit');
  const debitTxs = transactions.filter((t: DashboardTransaction) => t.direction === 'debit');
  const totalCredits = creditTxs.reduce((acc, t) => acc.plus(money(t.amount || '0')), money(0));
  const totalDebits = debitTxs.reduce((acc, t) => acc.plus(money(t.amount || '0')), money(0));
  const cashBalance = totalCredits.minus(totalDebits);

  const shopName = shop?.name || 'My Business';
  const ownerName = shop?.owner_name || 'Business Owner';
  const ownerInitials = ownerName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const unmatchedCount = transactions.filter((t: DashboardTransaction) => t.reconciliation_status === 'unmatched').length;
  const pendingReviewCount = invoices.filter((i: DashboardInvoice) => i.review_state === 'pending_review').length;

  // Real month-over-month deltas derived from invoice dates — no fabricated
  // percentages. When there is no prior-month baseline the UI shows "—".
  const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthKey = monthKey(today);
  const lastMonthKey = monthKey(new Date(today.getFullYear(), today.getMonth() - 1, 1));

  const salesThisMonth = salesInvoices.filter((i) => i.invoice_date?.startsWith(thisMonthKey));
  const salesLastMonth = salesInvoices.filter((i) => i.invoice_date?.startsWith(lastMonthKey));
  const purchasesThisMonth = purchaseInvoices.filter((i) => i.invoice_date?.startsWith(thisMonthKey));
  const purchasesLastMonth = purchaseInvoices.filter((i) => i.invoice_date?.startsWith(lastMonthKey));

  const revenueThisMonth = salesThisMonth.reduce((acc, inv) => acc.plus(money(inv.total_amount || '0')), money(0));
  const revenueLastMonth = salesLastMonth.reduce((acc, inv) => acc.plus(money(inv.total_amount || '0')), money(0));
  const expensesThisMonth = purchasesThisMonth.reduce((acc, inv) => acc.plus(money(inv.total_amount || '0')), money(0));
  const expensesLastMonth = purchasesLastMonth.reduce((acc, inv) => acc.plus(money(inv.total_amount || '0')), money(0));

  function percentDelta(current: Decimal, previous: Decimal): string | null {
    if (previous.lte(0)) return null;
    const diff = current.minus(previous).div(previous).mul(100);
    const sign = diff.gt(0) ? '+' : diff.lt(0) ? '-' : '';
    return `${sign}${Math.abs(diff.toDecimalPlaces(1).toNumber())}%`;
  }
  const revenueDelta = percentDelta(revenueThisMonth, revenueLastMonth);
  const expensesDelta = percentDelta(expensesThisMonth, expensesLastMonth);

  // GSTR-3B statutory due date: 20th of the month following the tax period.
  const gstDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 20);
  const daysToDue = Math.ceil((gstDueDate.getTime() - today.getTime()) / 86400000);
  const gstDueText = `Due ${gstDueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}${daysToDue >= 0 ? ` · in ${daysToDue} days` : ''}`;

  // Real cash-flow series: last 6 months derived from invoice dates
  const cashFlowSeries = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - idx), 1);
    const key = monthKey(d);
    const label = d.toLocaleString('en-IN', { month: 'short' });
    const rev = salesInvoices
      .filter((i) => i.invoice_date?.startsWith(key))
      .reduce((a, i) => a.plus(money(i.total_amount || '0')), money(0));
    const exp = purchaseInvoices
      .filter((i) => i.invoice_date?.startsWith(key))
      .reduce((a, i) => a.plus(money(i.total_amount || '0')), money(0));
    return { month: label, revenue: rev.toNumber(), expenses: exp.toNumber() };
  });

  // GSTR-3B readiness: share of this period's sales invoices confirmed by
  // review (0% when the period has no recorded sales).
  const confirmedSalesThisMonth = salesThisMonth.filter((i) => i.review_state === 'confirmed').length;
  const filingCompletion = salesThisMonth.length === 0 ? 0 : Math.floor((confirmedSalesThisMonth / salesThisMonth.length) * 100);
  const filingReady = salesThisMonth.length > 0 && filingCompletion >= 100;

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
                {shopName}
              </span>
            </span>
            <ChevronsUpDown className="text-muted-foreground shrink-0 size-4" />
          </button>
          <nav className="flex mt-7 flex-col flex-1 gap-1">
            <a
              href="/dashboard"
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </a>
            <a
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/transactions')}
              href="/transactions"
            >
              <ArrowLeftRight className="size-4" />
              <span>Transactions</span>
            </a>
            <a
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/gst')}
              href="/gst"
            >
              <ReceiptText className="size-4" />
              <span>{`GST & Tax`}</span>
            </a>
            <a
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/banking')}
              href="/banking"
            >
              <Landmark className="size-4" />
              <span>Banking</span>
            </a>
            <a
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/reports')}
              href="/reports"
            >
              <BarChart3 className="size-4" />
              <span>Reports</span>
            </a>
            <a
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/contacts')}
              href="/contacts"
            >
              <Users className="size-4" />
              <span>Contacts</span>
            </a>
            <a
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/settings')}
              href="/settings"
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </a>
          </nav>
          <div className="border-x border-t border-b flex pt-4 flex-col gap-2 relative">
            <a
              href="/faq"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <CircleHelp className="size-4" />
              <span>{`Help & support`}</span>
            </a>
            <button
              className="text-left rounded-md flex px-3 py-2 items-center gap-3 hover:bg-accent active:bg-muted hover:active:bg-muted"
              onClick={() => setAccountPanel(accountPanel === 'sidebar' ? null : 'sidebar')}
              aria-haspopup="menu"
              aria-expanded={accountPanel === 'sidebar'}
            >
              <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8">
                {ownerInitials}
              </span>
              <span className="min-w-0">
                <span className="font-medium text-ellipsis whitespace-nowrap text-foreground text-sm block overflow-hidden">
                  {ownerName}
                </span>
                <span className="text-ellipsis whitespace-nowrap text-muted-foreground text-xs block overflow-hidden">
                  {ownerEmail || 'Admin'}
                </span>
              </span>
              <MoreHorizontal className="text-muted-foreground ml-auto shrink-0 size-4" />
            </button>
            {accountPanel === 'sidebar' && (
              <AccountMenuPanel
                variant="sidebar"
                ownerEmail={ownerEmail}
                deleteStage={deleteStage}
                deleteConfirmText={deleteConfirmText}
                deletingAccount={deletingAccount}
                accountError={accountError}
                onClose={closeAccountPanel}
                onStartDelete={openDeleteConfirmation}
                onDelete={handleDeleteAccount}
                onLogout={handleLogout}
                onConfirmTextChange={setDeleteConfirmText}
              />
            )}
          </div>
        </aside>
        <div className="ml-64 min-h-screen">
          <header className="bg-background border-t border-r border-b border-b-border border-l-border flex fixed z-10 top-0 right-0 left-64 px-8 justify-between items-center h-16">
            <div className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">DIGITAX</span>
              <ChevronRight className="text-muted-foreground size-4" />
              <span className="font-medium text-foreground">Overview</span>
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
              <div className="relative">
                <button
                  aria-label="Open profile"
                  aria-haspopup="menu"
                  aria-expanded={accountPanel === 'header'}
                  className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center size-8"
                  onClick={() => setAccountPanel(accountPanel === 'header' ? null : 'header')}
                >
                  {ownerInitials}
                </button>
                {accountPanel === 'header' && (
                  <AccountMenuPanel
                    variant="header"
                    ownerEmail={ownerEmail}
                    deleteStage={deleteStage}
                    deleteConfirmText={deleteConfirmText}
                    deletingAccount={deletingAccount}
                    accountError={accountError}
                    onClose={closeAccountPanel}
                    onStartDelete={openDeleteConfirmation}
                    onDelete={handleDeleteAccount}
                    onLogout={handleLogout}
                    onConfirmTextChange={setDeleteConfirmText}
                  />
                )}
              </div>
            </div>
          </header>
          <main className="px-8 pt-24 pb-8">
            <div className="mx-auto max-w-7xl">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-semibold text-foreground text-2xl tracking-tight">
                    Good morning, {ownerName.split(' ')[0]}
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    Here&rsquo;s your business snapshot.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue="This month">
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="This month">This month</SelectItem>
                      <SelectItem value="Last month">Last month</SelectItem>
                      <SelectItem value="This quarter">This quarter</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => router.push('/expense-capture')}>
                    Add transaction
                  </Button>
                </div>
              </div>
              <div className="grid mt-8 gap-4 grid-cols-4">
                <Card className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">
                      Total revenue
                    </span>
                    <TrendingUp className="text-primary size-4" />
                  </div>
                  <div className="font-semibold text-2xl tracking-tight mt-4">
                    {formatINR(totalRevenue.toString())}
                  </div>
                  <div className={`text-xs mt-2 ${revenueDelta?.startsWith('-') ? 'text-error-600' : 'text-primary'}`}>
                    {revenueDelta ?? '—'}
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">
                      Total expenses
                    </span>
                  </div>
                  <div className="font-semibold text-2xl tracking-tight mt-4">
                    {formatINR(totalExpenses.toString())}
                  </div>
                  <div className={`text-xs mt-2 ${expensesDelta?.startsWith('-') ? 'text-primary' : 'text-error-600'}`}>
                    {expensesDelta ?? '—'}
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">
                      GST payable
                    </span>
                  </div>
                  <div className="font-semibold text-2xl tracking-tight mt-4">
                    {formatINR(gstLiability.toString())}
                  </div>
                  <div className="text-muted-foreground text-xs mt-2">
                    {gstDueText}
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">
                      Cash balance
                    </span>
                  </div>
                  <div className="font-semibold text-2xl tracking-tight mt-4">
                    {formatINR(cashBalance.toString())}
                  </div>
                  <div className="text-muted-foreground text-xs mt-2">
                    Updated just now
                  </div>
                </Card>
              </div>
              <div className="grid mt-6 gap-6 grid-cols-3">
                <Card className="p-6 col-span-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="font-semibold text-base">Cash flow</h2>
                      <p className="text-muted-foreground text-xs mt-1">
                        Revenue and expenses over time
                      </p>
                    </div>
                    <Tabs defaultValue="6 months">
                      <TabsList>
                        <TabsTrigger value="6 months">6 months</TabsTrigger>
                        <TabsTrigger value="12 months">12 months</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <ChartContainer
                    config={{
                      revenue: {
                        label: 'Revenue',
                        color: 'var(--color-chart-1)',
                      },
                      expenses: {
                        label: 'Expenses',
                        color: 'var(--color-chart-2)',
                      },
                    }}
                    className="mt-6 w-full h-64"
                  >
                    <RechartsAreaChart
                      data={cashFlowSeries}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-chart-1)"
                        fill="var(--color-chart-1)"
                        fillOpacity={0.16}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="var(--color-chart-2)"
                        fill="var(--color-chart-2)"
                        fillOpacity={0.08}
                        strokeWidth={2}
                      />
                    </RechartsAreaChart>
                  </ChartContainer>
                </Card>
                <Card className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="font-semibold text-base">
                        GST filing status
                      </h2>
                      <p className="text-muted-foreground text-xs mt-1">
                        GSTR-3B · Current period
                      </p>
                    </div>
                    <span className="font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1">
                      {filingReady ? 'Ready for review' : 'In progress'}
                    </span>
                  </div>
                  <div className="flex mt-8 justify-between items-end">
                    <span className="text-muted-foreground text-sm">
                      Completion
                    </span>
                    <span className="font-semibold text-lg">{filingCompletion}%</span>
                  </div>
                  <div className="rounded-full bg-muted mt-3 w-full h-2">
                    <div className="rounded-full bg-primary h-2" style={{ width: `${filingCompletion}%` }} />
                  </div>
                  <div className="text-sm flex mt-6 justify-between items-center">
                    <span className="text-muted-foreground">Due date</span>
                    <span className="font-medium">
                      {gstDueDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <Button
                    className="mt-6 w-full"
                    onClick={() => router.push('/gst-return-filing')}
                  >
                    Review return
                  </Button>
                </Card>
              </div>
              <div className="grid mt-6 gap-6 grid-cols-2">
                <Card className="p-6">
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-base">
                      Recent transactions
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/transactions')}
                    >
                      View all transactions
                    </Button>
                  </div>
                  <div className="mt-5">
                    {transactions.slice(0, 4).map((txn) => (
                      <div key={txn.id} className="border-t border-r border-b border-b-border border-l-border flex py-3 justify-between items-center">
                        <div>
                          <div className="font-medium text-sm">
                            {txn.description || 'Transaction'}
                          </div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {txn.source || 'Bank'} · {txn.transaction_date ? new Date(txn.transaction_date).toLocaleDateString('en-IN') : ''}
                          </div>
                        </div>
                        <span className="font-medium text-sm">
                          {formatINR(txn.amount || '0')}
                        </span>
                      </div>
                    ))}
                    {transactions.length === 0 && (
                      <div className="py-3 text-center text-xs text-text-tertiary">
                        No transactions yet. Import your bank statement to get started.
                      </div>
                    )}
                  </div>
                </Card>
                <Card className="p-6">
                  <h2 className="font-semibold text-base">
                    Tasks to keep moving
                  </h2>
                  <div className="flex mt-5 flex-col gap-2">
                    {unmatchedCount > 0 && (
                      <div
                        onClick={() => router.push('/reconciliation')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') router.push('/reconciliation'); }}
                        className="cursor-pointer rounded-md border border-border flex px-4 py-3 items-center gap-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            Match {unmatchedCount} bank transactions
                          </div>
                          <span className="font-medium rounded-md bg-primary/10 text-primary text-xs inline-flex mt-1 px-2 py-1">
                            To do
                          </span>
                        </div>
                        <ChevronRight className="text-muted-foreground size-4" />
                      </div>
                    )}
                    {pendingReviewCount > 0 && (
                      <div
                        onClick={() => router.push('/review')}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === 'Enter') router.push('/review'); }}
                        className="cursor-pointer rounded-md border border-border flex px-4 py-3 items-center gap-3 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            Review {pendingReviewCount} invoices
                          </div>
                          <span className="font-medium rounded-md bg-muted text-muted-foreground text-xs inline-flex mt-1 px-2 py-1">
                            Pending
                          </span>
                        </div>
                        <ChevronRight className="text-muted-foreground size-4" />
                      </div>
                    )}
                    <div
                      onClick={() => router.push('/documents')}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter') router.push('/documents'); }}
                      className="cursor-pointer rounded-md border border-border flex px-4 py-3 items-center gap-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          Upload purchase invoices
                        </div>
                        <span className="font-medium rounded-md bg-muted text-muted-foreground text-xs inline-flex mt-1 px-2 py-1">
                          Pending
                        </span>
                      </div>
                      <ChevronRight className="text-muted-foreground size-4" />
                    </div>
                  </div>
                </Card>
              </div>
              <p className="text-muted-foreground text-xs mt-8">
                Live data · synced from your business records
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

function AccountMenuPanel({
  variant,
  ownerEmail,
  deleteStage,
  deleteConfirmText,
  deletingAccount,
  accountError,
  onClose,
  onStartDelete,
  onDelete,
  onLogout,
  onConfirmTextChange,
}: {
  variant: 'sidebar' | 'header';
  ownerEmail: string | null;
  deleteStage: 'idle' | 'confirm';
  deleteConfirmText: string;
  deletingAccount: boolean;
  accountError: string | null;
  onClose: () => void;
  onStartDelete: () => void;
  onDelete: () => void;
  onLogout: () => void;
  onConfirmTextChange: (value: string) => void;
}) {
  const position =
    variant === 'sidebar'
      ? 'absolute left-3 right-3 bottom-2 z-30'
      : 'fixed top-16 right-4 z-30 w-80';

  return (
    <>
      <div className="fixed inset-0 z-20" onClick={onClose} aria-hidden="true" />
      <div
        role="menu"
        aria-label="Account options"
        className={`${position} rounded-xl border border-border bg-card shadow-lg p-4`}
      >
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8">
            {(ownerEmail || '').slice(0, 1).toUpperCase() || 'A'}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {ownerEmail || 'Signed in'}
            </p>
            <p className="text-xs text-muted-foreground">Account options</p>
          </div>
        </div>

        {deleteStage === 'idle' ? (
          <div className="flex flex-col pt-2 gap-1">
            <button
              role="menuitem"
              onClick={onLogout}
              className="rounded-md text-sm flex px-3 items-center gap-3 h-10 text-foreground hover:bg-accent"
            >
              <LogOut className="size-4 text-muted-foreground" />
              <span>Log out</span>
            </button>
            <button
              role="menuitem"
              onClick={onStartDelete}
              className="rounded-md text-sm flex px-3 items-center gap-3 h-10 text-error-600 dark:text-error-400 hover:bg-error-50 dark:hover:bg-error-500/10"
            >
              <Trash2 className="size-4" />
              <span>Delete account</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col pt-3 gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="size-4 text-error-600 shrink-0 mt-0.5" />
              <p className="text-xs text-foreground leading-5">
                This permanently deletes your account, your business(es), invoices,
                transactions, documents and GST summaries. The compliance audit log is
                retained. Accounts with audit or import records cannot be deleted
                automatically and will be directed to support. This cannot be undone.
              </p>
            </div>
            <input
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
              placeholder="Type DELETE to confirm"
              value={deleteConfirmText}
              onChange={(e) => onConfirmTextChange(e.target.value)}
              disabled={deletingAccount}
              autoFocus
            />
            {accountError && (
              <div className="p-2 rounded-md bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-800 text-xs text-error-700 dark:text-error-400">
                <p>{accountError}</p>
                <Link
                  href="/faq"
                  className="font-medium underline underline-offset-2 mt-1 inline-block"
                >
                  Go to Help &amp; support
                </Link>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={onDelete}
                disabled={deleteConfirmText !== 'DELETE' || deletingAccount}
                isLoading={deletingAccount}
                className="bg-error-600 hover:bg-error-700 text-white"
              >
                {deletingAccount ? 'Deleting…' : 'Delete account'}
              </Button>
              <Button variant="outline" size="sm" onClick={onClose} disabled={deletingAccount}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

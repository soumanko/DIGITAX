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
  Download,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';
import Decimal from 'decimal.js';
import { money, roundMoney } from '@/lib/decimal';

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

interface QuarterOption {
  key: string; // 'yyyy-N'
  label: string; // 'Apr–Jun 2026'
  startMonth: number; // calendar month of quarter start, 1-12
  startYear: number; // calendar year of quarter start
}

const QUARTER_LABELS = ['Apr–Jun', 'Jul–Sep', 'Oct–Dec', 'Jan–Mar'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function buildQuarterOptions(now: Date): QuarterOption[] {
  // Indian fiscal year: April–March. Quarters: Apr–Jun, Jul–Sep, Oct–Dec, Jan–Mar(next year).
  const fyStartYear = now.getMonth() + 1 >= 4 ? now.getFullYear() : now.getFullYear() - 1;
  const quarters: Array<{ startMonth: number; startYear: number; label: string }> = [
    { startMonth: 4, startYear: fyStartYear, label: `${QUARTER_LABELS[0]} ${fyStartYear}` },
    { startMonth: 7, startYear: fyStartYear, label: `${QUARTER_LABELS[1]} ${fyStartYear}` },
    { startMonth: 10, startYear: fyStartYear, label: `${QUARTER_LABELS[2]} ${fyStartYear}` },
    {
      startMonth: 1,
      startYear: fyStartYear + 1,
      label: `${QUARTER_LABELS[3]} ${String((fyStartYear + 1) % 100).padStart(2, '0')}`,
    },
  ];
  return quarters.map((q, i) => ({
    ...q,
    key: `${fyStartYear}-${i + 1}`,
  })).reverse(); // newest fiscal quarter first in the dropdown
}

function quarterRange(opt: QuarterOption): { start: Date; end: Date } {
  // End is exclusive: first day of the following month.
  return {
    start: new Date(opt.startYear, opt.startMonth - 1, 1),
    end: new Date(opt.startYear, opt.startMonth + 2, 1), // month index Math: startMonth-1 + 3 = startMonth+2
  };
}

export default function CashFlow() {
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
  const [granularity, setGranularity] = useState('monthly');

  // Time-dependent period options are computed on the client after mount (never during prerender).
  const [quarterOptions, setQuarterOptions] = useState<QuarterOption[]>([]);
  const [quarter, setQuarter] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await Promise.resolve();
      if (cancelled) return;
      setQuarterOptions(buildQuarterOptions(new Date()));
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

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

  // Quarters that actually contain this business's movements (used to choose the default).
  const activeQuarters = useMemo(() => {
    const set = new Set(
      (transactions || []).map((t) => {
        const d = t.transaction_date ? new Date(t.transaction_date) : null;
        if (!d || isNaN(d.getTime())) return '';
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        // Map calendar month to FY quarter index
        const fyStartYear = m >= 4 ? y : y - 1;
        const qIdx = m >= 4 && m <= 6 ? 1 : m >= 7 && m <= 9 ? 2 : m >= 10 ? 3 : 4;
        return `${fyStartYear}-${qIdx}`;
      }).filter(Boolean)
    );
    return set;
  }, [transactions]);

  useEffect(() => {
    let cancelled = false;
    async function setDefault() {
      await Promise.resolve();
      if (cancelled || transactions === null) return;
      // Prefer the latest quarter with data when the default has none.
      if (!activeQuarters.has(quarter) && activeQuarters.size > 0) {
        const latestWith = quarterOptions.find((o) => activeQuarters.has(o.key));
        if (latestWith) setQuarter(latestWith.key);
      }
    }
    setDefault();
    return () => {
      cancelled = true;
    };
  }, [transactions, activeQuarters, quarterOptions, quarter]);

  const selected = quarterOptions.find((o) => o.key === quarter) || quarterOptions[0];
  const range = selected ? quarterRange(selected) : null;

  const toDecimal = (raw?: string | number) => {
    try {
      return money(String(raw ?? '0'));
    } catch {
      return money(0);
    }
  };

  // Authoritative aggregates computed with Decimal (never floating-point).
  const aggregates = useMemo(() => {
    if (!transactions || !range) return null;
    let opening = money(0);
    let cashIn = money(0);
    let cashOut = money(0);
    const inByCategory = new Map<string, { label: string; sum: Decimal }>();
    const outByCategory = new Map<string, { label: string; sum: Decimal }>();
    const buckets = new Map<
      string,
      { label: string; cashIn: Decimal; cashOut: Decimal; sortKey: number }
    >();

    const bucketKey = (d: Date) => {
      if (granularity === 'monthly') {
        return { key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_NAMES[d.getMonth()], sort: d.getFullYear() * 12 + d.getMonth() };
      }
      // weekly: ISO-ish week start (Monday), unique by day offset
      const day = Math.floor(d.getTime() / 86400000);
      const weekStart = new Date(d.getTime() - ((d.getDay() + 6) % 7) * 86400000);
      return {
        key: `w${day}`,
        label: `${weekStart.getDate()} ${MONTH_NAMES[weekStart.getMonth()]}`,
        sort: day,
      };
    };

    for (const t of transactions) {
      const amt = toDecimal(t.amount);
      const d = t.transaction_date ? new Date(t.transaction_date) : null;
      if (!d || isNaN(d.getTime())) continue;
      const inRange = d >= range.start && d < range.end;
      if (!inRange) {
        // Opening cash includes every movement before the period, credit − debit.
        opening = opening.plus(t.direction === 'credit' ? amt : amt.negated());
        continue;
      }
      if (t.direction === 'credit') {
        cashIn = cashIn.plus(amt);
        const cat = (t.category || 'other_income').replace(/_/g, ' ');
        const e = inByCategory.get(cat) || { label: cat, sum: money(0) };
        e.sum = e.sum.plus(amt);
        inByCategory.set(cat, e);
      } else {
        cashOut = cashOut.plus(amt);
        const cat = (t.category || 'operating').replace(/_/g, ' ');
        const e = outByCategory.get(cat) || { label: cat, sum: money(0) };
        e.sum = e.sum.plus(amt);
        outByCategory.set(cat, e);
      }
      const bk = bucketKey(d);
      const bEntry =
        buckets.get(bk.key) ||
        { label: bk.label, cashIn: money(0), cashOut: money(0), sortKey: bk.sort };
      if (t.direction === 'credit') bEntry.cashIn = bEntry.cashIn.plus(amt);
      else bEntry.cashOut = bEntry.cashOut.plus(amt);
      buckets.set(bk.key, bEntry);
    }

    const closing = opening.plus(cashIn).minus(cashOut);
    const rounding = (v: Decimal) => roundMoney(v);

    const chart = Array.from(buckets.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map((b) => ({
        month: b.label,
        cashIn: rounding(b.cashIn).toNumber(),
        cashOut: rounding(b.cashOut).toNumber(),
      }));

    const topIn = Array.from(inByCategory.values())
      .sort((a, b) => (b.sum.gt(a.sum) ? 1 : -1))
      .slice(0, 2);
    const inTotalTop = topIn.reduce((s, e) => s.plus(e.sum), money(0));
    const inOther = cashIn.minus(inTotalTop);
    const inRows = topIn.map((e) => ({ label: e.label, value: e.sum }));
    if (inOther.gt(0) && topIn.length > 0) inRows.push({ label: 'Other income', value: inOther });

    const topOut = Array.from(outByCategory.values())
      .sort((a, b) => (b.sum.gt(a.sum) ? 1 : -1))
      .slice(0, 3);
    const outRows = topOut.map((e) => ({ label: e.label, value: e.sum }));
    if (outRows.length === 0 && cashOut.gt(0)) {
      outRows.push({ label: 'Uncategorised outflow', value: cashOut });
    }

    return {
      opening: roundMoney(opening).toNumber(),
      cashIn: roundMoney(cashIn).toNumber(),
      cashOut: roundMoney(cashOut).toNumber(),
      closing: rounding(closing).toNumber(),
      netMove: roundMoney(cashIn.minus(cashOut)).toNumber(),
      chart,
      inRows,
      outRows,
    };
  }, [transactions, range, granularity]);

  function exportCsv() {
    if (!aggregates || !selected) return;
    const lines: string[] = [];
    lines.push('DIGITAX Cash flow export');
    lines.push(`Period,${selected.label}`);
    lines.push(`Opening cash,${aggregates.opening}`);
    lines.push(`Cash in,${aggregates.cashIn}`);
    lines.push(`Cash out,${aggregates.cashOut}`);
    lines.push(`Closing cash,${aggregates.closing}`);
    lines.push(`Net movement,${aggregates.netMove}`);
    lines.push('');
    lines.push('Bucket,Cash in,Cash out');
    for (const b of aggregates.chart) lines.push(`${b.month},${b.cashIn},${b.cashOut}`);
    lines.push('');
    lines.push('Cash in category,Amount');
    for (const r of aggregates.inRows) lines.push(`${r.label},${r.value}`);
    lines.push('');
    lines.push('Cash out category,Amount');
    for (const r of aggregates.outRows) lines.push(`${r.label},${r.value}`);
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cashflow_${selected.key}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground min-h-screen">
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
                className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
                <span className="text-muted-foreground">Reports</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="font-medium text-foreground">Cash flow</span>
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
                    Cash flow
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Understand where money came from and where it went.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={quarter}
                    onValueChange={(v) => setQuarter(v)}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quarterOptions.map((o) => (
                        <SelectItem key={o.key} value={o.key}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={granularity}
                    onValueChange={(v) => setGranularity(v)}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={exportCsv} disabled={!aggregates}>
                    <Download className="mr-2 size-4" />
                    Export
                  </Button>
                </div>
              </div>

              {ctxError || dataError ? (
                <Card className="mt-6">
                  <CardContent className="p-10 text-center">
                    <ReceiptText className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">
                      {ctxError ? 'Could not load your business context.' : dataError}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Cash figures are computed only from this business&apos;s own ledger.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => refresh()}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : ctxLoading || transactions === null ? (
                <Card className="mt-6">
                  <CardContent className="p-10 text-center">
                    <p className="font-medium text-muted-foreground">Computing cash movement…</p>
                  </CardContent>
                </Card>
              ) : needsOnboarding ? (
                <Card className="mt-6">
                  <CardContent className="p-10 text-center">
                    <Building2 className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">No business yet</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Complete onboarding to track cash movement for your business.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                      Set up business
                    </Button>
                  </CardContent>
                </Card>
              ) : !aggregates || (aggregates.cashIn === 0 && aggregates.cashOut === 0) ? (
                <Card className="mt-6">
                  <CardContent className="p-10 text-center">
                    <ReceiptText className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">
                      No movements in {selected?.label}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Import a bank statement and these figures compute from your own ledger.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => router.push('/expense-capture')}>
                      Import statement
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="grid mt-6 gap-4 grid-cols-4">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm">
                          Opening cash
                        </p>
                        <p className="font-semibold text-xl mt-2">{aggregates.opening.toLocaleString('en-IN')}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm">Cash in</p>
                        <p className="font-semibold text-primary text-xl mt-2">
                          {aggregates.cashIn.toLocaleString('en-IN')}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm">Cash out</p>
                        <p className="font-semibold text-xl mt-2">{aggregates.cashOut.toLocaleString('en-IN')}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-muted-foreground text-sm">
                          Closing cash
                        </p>
                        <p className="font-semibold text-xl mt-2">{aggregates.closing.toLocaleString('en-IN')}</p>
                      </CardContent>
                    </Card>
                  </div>
                  <Card className="mt-6">
                    <CardHeader className="flex pb-2 flex-row justify-between items-center">
                      <div className="mb-0">
                        <CardTitle>Cash movement</CardTitle>
                        <CardDescription>
                          {granularity === 'monthly' ? 'Monthly' : 'Weekly'} inflows and outflows for {selected?.label}
                        </CardDescription>
                      </div>
                      <div className="text-muted-foreground text-xs flex items-center gap-4">
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-chart-1 size-2.5" />
                          Cash in
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-chart-2 size-2.5" />
                          Cash out
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer
                        config={{
                          cashIn: {
                            label: 'Cash in',
                            color: 'var(--color-chart-1)',
                          },
                          cashOut: {
                            label: 'Cash out',
                            color: 'var(--color-chart-2)',
                          },
                        }}
                        className="w-full h-64"
                      >
                        <RechartsBarChart data={aggregates.chart}>
                          <CartesianGrid vertical={false} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <ChartTooltip />
                          <Bar
                            dataKey="cashIn"
                            stackId="movement"
                            fill="var(--color-chart-1)"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="cashOut"
                            stackId="movement"
                            fill="var(--color-chart-2)"
                            radius={[4, 4, 0, 0]}
                          />
                        </RechartsBarChart>
                      </ChartContainer>
                      <p className="text-muted-foreground text-xs mt-2">
                        Values in INR · live from your ledger
                      </p>
                    </CardContent>
                  </Card>
                  <div className="grid mt-6 gap-6 grid-cols-2">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Cash in</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {aggregates.inRows.map((r, i) => (
                          <div
                            key={r.label}
                            className={`text-sm border-x border-t border-b flex px-6 py-3 justify-between items-center capitalize ${i > 0 ? '' : 'border-b'}`}
                          >
                            <span className="capitalize">{r.label}</span>
                            <span className="font-medium">
                              {roundMoney(r.value).toNumber().toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                        {aggregates.inRows.length === 0 && (
                          <div className="text-sm text-muted-foreground flex px-6 py-6 justify-between items-center">
                            <span>No inflows in this period</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">Cash out</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {aggregates.outRows.map((r) => (
                          <div
                            key={r.label}
                            className="text-sm border-x border-t border-b flex px-6 py-3 justify-between items-center"
                          >
                            <span className="capitalize">{r.label}</span>
                            <span className="font-medium">
                              {roundMoney(r.value).toNumber().toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                        {aggregates.outRows.length === 0 && (
                          <div className="text-sm text-muted-foreground flex px-6 py-6 justify-between items-center">
                            <span>No outflows in this period</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  <div className="font-medium text-foreground text-sm flex mt-5 justify-end">
                    Net movement ·{' '}
                    {aggregates.netMove >= 0 ? '+' : '-'}
                    {Math.abs(aggregates.netMove).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

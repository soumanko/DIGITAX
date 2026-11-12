'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
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
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from 'recharts';
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';
import Decimal from 'decimal.js';
import { money, roundMoney } from '@/lib/decimal';

interface InvoiceShape {
  id: string;
  invoice_date?: string;
  taxable_value?: string;
  total_amount?: string;
  direction?: string;
  invoice_type?: string;
}

interface LedgerTransaction {
  id: string;
  transaction_date?: string;
  direction: string;
  amount: string;
  category?: string | null;
}

interface GstSummaryShape {
  gstr3b: {
    outward_supplies: { taxableValue: string };
    net_tax_payable: { total: string };
  };
}

interface QuarterOption {
  key: string;
  label: string;
  startMonth: number;
  startYear: number;
}

const QUARTER_LABELS = ['Apr–Jun', 'Jul–Sep', 'Oct–Dec', 'Jan–Mar'];
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function buildQuarterOptions(now: Date): QuarterOption[] {
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
  return quarters.map((q, i) => ({ ...q, key: `${fyStartYear}-${i + 1}` })).reverse();
}

function quarterMonths(opt: QuarterOption): Array<{ year: number; month: number }> {
  // consecutive 3 months starting at (startMonth, startYear)
  return [0, 1, 2].map((k) => {
    const d = new Date(opt.startYear, opt.startMonth - 1 + k, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
}

function inRange(iso: string | undefined, opt: QuarterOption): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return false;
  const months = quarterMonths(opt);
  const start = new Date(months[0].year, months[0].month - 1, 1);
  const end = new Date(months[2].year, months[2].month, 1);
  return d >= start && d < end;
}

function quarterMonthsLabel(opt: QuarterOption): string[] {
  return quarterMonths(opt).map((m) => MONTH_NAMES[m.month - 1]);
}

function compareQuarter(opt: QuarterOption, mode: 'previous_quarter' | 'previous_year'): QuarterOption {
  if (mode === 'previous_year') {
    return {
      key: `${opt.key}-py`,
      label: opt.label,
      startMonth: opt.startMonth,
      startYear: opt.startYear - 1,
    };
  }
  // previous quarter (FY order: Jan-Mar -> Oct-Dec etc.)
  const order: Array<{ startMonth: number; stepYear: number }> = opt.startMonth === 1
    ? [{ startMonth: 10, stepYear: -1 }]
    : opt.startMonth === 10
      ? [{ startMonth: 7, stepYear: 0 }]
      : opt.startMonth === 7
        ? [{ startMonth: 4, stepYear: 0 }]
        : [{ startMonth: 1, stepYear: 0 }]; // Apr -> previous is Jan-Mar (same FY, year+1)
  const q = order[0];
  let startYear = opt.startYear + q.stepYear;
  if (q.startMonth === 1) startYear = opt.startYear + 1;
  return {
    key: `${opt.key}-pq`,
    label: opt.label,
    startMonth: q.startMonth,
    startYear,
  };
}

interface QuarterFigures {
  revenue: Decimal; // outward taxable supplies (engine)
  taxes: Decimal; // net GST payable (engine)
  cogs: Decimal; // purchase invoices taxable value
  opex: Decimal; // expense debits from imported statements
  monthly: Array<{ month: string; revenue: number; expenses: number; netProfit: number }>;
  topExpenses: Array<{ label: string; value: Decimal }>;
  hasData: boolean;
}

function computeQuarter(
  opt: QuarterOption,
  invoices: InvoiceShape[],
  transactions: LedgerTransaction[],
  engineByMonth: Map<string, GstSummaryShape>
): QuarterFigures {
  // Engine-sourced revenue and taxes, month by month.
  let revTotal = money(0);
  let taxTotal = money(0);
  for (const m of quarterMonths(opt)) {
    const key = `${m.year}-${String(m.month).padStart(2, '0')}`;
    const s = engineByMonth.get(key);
    if (s) {
      revTotal = revTotal.plus(money(s.gstr3b.outward_supplies.taxableValue || '0'));
      taxTotal = taxTotal.plus(money(s.gstr3b.net_tax_payable.total || '0'));
    }
  }

  let cogs = money(0);
  const monthlyExpense = new Map<string, Decimal>(); // 'YYYY-MM' -> purchases taxable
  for (const inv of invoices) {
    const isPurchase = inv.direction === 'purchase' || inv.invoice_type === 'purchase_tax_invoice';
    if (!isPurchase || !inRange(inv.invoice_date, opt)) continue;
    const tv = money(inv.taxable_value || inv.total_amount || '0');
    cogs = cogs.plus(tv);
    const key = (inv.invoice_date || '').slice(0, 7);
    monthlyExpense.set(key, (monthlyExpense.get(key) || money(0)).plus(tv));
  }

  let opex = money(0);
  const expenseCats = new Map<string, Decimal>();
  const monthlyOpex = new Map<string, Decimal>();
  for (const t of transactions) {
    if (t.direction !== 'debit') continue;
    if (!inRange(t.transaction_date, opt)) continue;
    const cat = (t.category || 'operating').replace(/_/g, ' ');
    if (cat === 'business sale') continue; // revenue-side movement, not an expense
    const amt = money(t.amount || '0');
    opex = opex.plus(amt);
    expenseCats.set(cat, (expenseCats.get(cat) || money(0)).plus(amt));
    const key = (t.transaction_date || '').slice(0, 7);
    monthlyOpex.set(key, (monthlyOpex.get(key) || money(0)).plus(amt));
  }

  const grossProfit = revTotal.minus(cogs);
  const ebitda = grossProfit.minus(opex);
  const net = ebitda.minus(taxTotal);

  const monthly = quarterMonthsLabel(opt).map((label, i) => {
    const m = quarterMonths(opt)[i];
    const key = `${m.year}-${String(m.month).padStart(2, '0')}`;
    const s = engineByMonth.get(key);
    const rev = money(s?.gstr3b.outward_supplies.taxableValue || '0');
    const exp = (monthlyExpense.get(key) || money(0)).plus(monthlyOpex.get(key) || money(0));
    const tax = money(s?.gstr3b.net_tax_payable.total || '0');
    return {
      month: label,
      revenue: roundMoney(rev).toNumber(),
      expenses: roundMoney(exp).toNumber(),
      netProfit: roundMoney(rev.minus(exp).minus(tax)).toNumber(),
    };
  });

  const top = Array.from(expenseCats.entries())
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => (b.value.gt(a.value) ? 1 : -1))
    .slice(0, 4);

  const hasData =
    revTotal.gt(0) || cogs.gt(0) || opex.gt(0) || taxTotal.gt(0);

  return {
    revenue: revTotal,
    taxes: taxTotal,
    cogs,
    opex,
    monthly,
    topExpenses: top,
    hasData,
  };
}

function deltaPct(current: Decimal, base: Decimal): string {
  if (base.eq(0)) return current.gt(0) ? '+100%' : '—';
  const pct = current.minus(base).dividedBy(base).times(100).toFixed(1);
  return pct.startsWith('-') ? `${pct}%` : `+${pct}%`;
}

const fmt = (d: Decimal): string => roundMoney(d).toNumber().toLocaleString('en-IN');

export default function ProfitLoss() {
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
  const [transactions, setTransactions] = useState<LedgerTransaction[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<'previous_quarter' | 'previous_year'>(
    'previous_quarter'
  );

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
            invData?.error || txnData?.error || 'Statement data could not be loaded right now.'
          );
          setInvoices([]);
          setTransactions([]);
          return;
        }
        setInvoices(Array.isArray(invData?.invoices) ? invData.invoices : []);
        setTransactions(Array.isArray(txnData?.transactions) ? txnData.transactions : []);
      } catch {
        if (!cancelled) {
          setDataError('Network error while loading the statement.');
          setInvoices([]);
          setTransactions([]);
        }
      }
    }
    if (!ctxLoading) load();
    return () => {
      cancelled = true;
    };
  }, [ctxLoading, shop?.id]);

  const selected = quarterOptions.find((o) => o.key === quarter) || quarterOptions[0];

  // Monthly engine figures come only from the authorised GST summary route.
  const [engineData, setEngineData] = useState<{ map: Map<string, GstSummaryShape>; loaded: boolean }>({
    map: new Map(),
    loaded: false,
  });

  useEffect(() => {
    if (invoices === null || transactions === null || !selected) return;
    let cancelled = false;
    async function loadEngine() {
      await Promise.resolve();
      if (cancelled) return;
      setEngineData({ map: new Map(), loaded: false });
      const months = new Set<string>();
      for (const m of quarterMonths(selected)) {
        months.add(`${m.year}-${String(m.month).padStart(2, '0')}`);
      }
      const base = compareQuarter(selected, compareMode);
      for (const m of quarterMonths(base)) {
        months.add(`${m.year}-${String(m.month).padStart(2, '0')}`);
      }
      const entries = await Promise.all(
        Array.from(months).map(async (key) => {
          const [year, month] = key.split('-').map(Number);
          try {
            const res = await fetch(`/api/gst/summary?year=${year}&month=${month}`, {
              cache: 'no-store',
            });
            if (!res.ok) return [key, null] as const;
            const data = await res.json().catch(() => null);
            return [key, data?.summary || null] as const;
          } catch {
            return [key, null] as const;
          }
        })
      );
      if (cancelled) return;
      const map = new Map<string, GstSummaryShape>();
      for (const [key, summary] of entries) {
        if (summary) map.set(key, summary);
      }
      setEngineData({ map, loaded: true });
    }
    loadEngine();
    return () => {
      cancelled = true;
    };
  }, [invoices, transactions, selected?.key, compareMode]);

  const current = useMemo(() => {
    if (!invoices || !transactions || !selected || !engineData.loaded) return null;
    return computeQuarter(selected, invoices, transactions, engineData.map);
  }, [invoices, transactions, selected, engineData]);

  const comparison = useMemo(() => {
    if (!invoices || !transactions || !selected || !engineData.loaded) return null;
    return computeQuarter(compareQuarter(selected, compareMode), invoices, transactions, engineData.map);
  }, [invoices, transactions, selected, compareMode, engineData]);

  const grossProfit = current ? current.revenue.minus(current.cogs) : money(0);
  const ebitda = current ? grossProfit.minus(current.opex) : money(0);
  const netProfit = current ? ebitda.minus(current.taxes) : money(0);
  const maxExpense = current && current.topExpenses.length
    ? current.topExpenses[0].value
    : money(0);

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
            <Link
              href="/dashboard"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </Link>
            <Link
              href="/transactions"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
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
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
              <span className="text-muted-foreground">Reports</span>
              <ChevronRight className="text-muted-foreground size-4" />
              <span className="font-medium text-foreground">{`Profit & Loss`}</span>
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
            <div className="flex mb-6 justify-between items-start">
              <div>
                <div className="flex mb-2 items-center gap-3">
                  <h1 className="font-semibold text-2xl tracking-tight">{`Profit & Loss`}</h1>
                  <span className="rounded-sm bg-primary/10 text-primary text-xs px-2 py-1">
                    Live data
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  A clear view of performance for the quarter.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={quarter} onValueChange={(v) => setQuarter(v)}>
                  <SelectTrigger className="w-40">
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
                  value={compareMode}
                  onValueChange={(v) => setCompareMode(v as 'previous_quarter' | 'previous_year')}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="previous_quarter">Previous quarter</SelectItem>
                    <SelectItem value="previous_year">Previous year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => router.push('/reports')}>
                  <Download className="mr-2 size-4" />
                  Export PDF
                </Button>
              </div>
            </div>

            {ctxError || dataError ? (
              <Card className="mb-6">
                <div className="p-10 text-center">
                  <ReceiptText className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">
                    {ctxError ? 'Could not load your business context.' : dataError}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    The statement is computed only from this business&apos;s own records.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => refresh()}>
                    Retry
                  </Button>
                </div>
              </Card>
            ) : ctxLoading || invoices === null || transactions === null || !current ? (
              <Card className="mb-6">
                <div className="p-10 text-center">
                  <p className="font-medium text-muted-foreground">Computing the statement…</p>
                </div>
              </Card>
            ) : needsOnboarding ? (
              <Card className="mb-6">
                <div className="p-10 text-center">
                  <Building2 className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">No business yet</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Complete onboarding to compute performance for your business.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                    Set up business
                  </Button>
                </div>
              </Card>
            ) : !current.hasData ? (
              <Card className="mb-6">
                <div className="p-10 text-center">
                  <ReceiptText className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">No records in {selected?.label}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Record sales and purchase invoices, and import statements, to see the statement compute.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => router.push('/invoices')}>
                    Go to invoices
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid mb-6 gap-4 grid-cols-4">
                  <Card className="p-5">
                    <p className="text-muted-foreground text-sm">Revenue</p>
                    <p className="font-semibold text-2xl mt-3">{fmt(current.revenue)}</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Outward taxable supplies · engine
                    </p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-muted-foreground text-sm">Gross profit</p>
                    <p className="font-semibold text-2xl mt-3">{fmt(grossProfit)}</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      {current.revenue.gt(0)
                        ? `${roundMoney(grossProfit.dividedBy(current.revenue).times(100)).toNumber()}% margin`
                        : 'Revenue needed for margin'}
                    </p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-muted-foreground text-sm">
                      Operating expenses
                    </p>
                    <p className="font-semibold text-2xl mt-3">{fmt(current.opex)}</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Statement debits · imported
                    </p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-muted-foreground text-sm">Net profit</p>
                    <p className="font-semibold text-2xl mt-3">{fmt(netProfit)}</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      After net GST payable
                    </p>
                  </Card>
                </div>
                <Card className="mb-6 p-6">
                  <div className="flex mb-5 justify-between items-center">
                    <div>
                      <h2 className="font-semibold text-lg">Performance trend</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        Monthly performance across revenue and costs
                      </p>
                    </div>
                    <span className="text-muted-foreground text-xs">
                      Live data
                    </span>
                  </div>
                  <ChartContainer
                    config={{
                      revenue: { label: 'Revenue', color: 'var(--color-chart-1)' },
                      expenses: {
                        label: 'Expenses',
                        color: 'var(--color-chart-2)',
                      },
                      netProfit: {
                        label: 'Net profit',
                        color: 'var(--color-chart-3)',
                      },
                    }}
                    className="w-full h-64"
                  >
                    <RechartsLineChart data={current.monthly}>
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-chart-1)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="expenses"
                        stroke="var(--color-chart-2)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="netProfit"
                        stroke="var(--color-chart-3)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </RechartsLineChart>
                  </ChartContainer>
                  <div className="text-sm flex mt-5 items-center gap-6">
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-chart-1 size-2" />
                      Revenue
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-chart-2 size-2" />
                      Expenses
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-chart-3 size-2" />
                      Net profit
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mt-3">
                    Computed from this business&apos;s invoices, statements, and the GST engine for{' '}
                    {selected?.label}.
                  </p>
                </Card>
                <div className="grid gap-6 grid-cols-3">
                  <Card className="p-6 col-span-2">
                    <div className="flex mb-4 justify-between items-center">
                      <h2 className="font-semibold text-lg">Statement</h2>
                      <span className="text-muted-foreground text-xs">
                        Live data
                      </span>
                    </div>
                    <Table>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">
                            <span className="flex items-center gap-2">
                              <ChevronDown className="text-muted-foreground size-4" />
                              Revenue
                            </span>
                          </TableCell>
                          <TableCell className="font-medium text-right">
                            {fmt(current.revenue)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground pl-10">
                            Cost of goods sold
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            -{fmt(current.cogs)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">
                            Gross profit
                          </TableCell>
                          <TableCell className="font-medium text-right">
                            {fmt(grossProfit)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground pl-10">
                            Operating expenses
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            -{fmt(current.opex)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="bg-muted/50">
                          <TableCell className="font-medium">EBITDA</TableCell>
                          <TableCell className="font-medium text-right">
                            {fmt(ebitda)}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-muted-foreground pl-10">
                            Taxes (net GST payable)
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            -{fmt(current.taxes)}
                          </TableCell>
                        </TableRow>
                        <TableRow className="border-t-2">
                          <TableCell className="font-semibold">
                            Net profit
                          </TableCell>
                          <TableCell className="font-semibold text-right">
                            {fmt(netProfit)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                    {comparison && comparison.hasData && (
                      <p className="text-muted-foreground text-xs mt-3">
                        vs previous {compareMode === 'previous_year' ? 'year' : 'quarter'}: revenue{' '}
                        {deltaPct(current.revenue, comparison.revenue)}, opex{' '}
                        {deltaPct(current.opex, comparison.opex)}, net profit{' '}
                        {deltaPct(
                          ebitda.minus(current.taxes),
                          comparison.revenue.minus(comparison.cogs).minus(comparison.opex).minus(comparison.taxes)
                        )}
                      </p>
                    )}
                  </Card>
                  <Card className="p-6">
                    <div className="flex mb-6 justify-between items-center">
                      <h2 className="font-semibold text-lg">
                        Top expense categories
                      </h2>
                      <span className="text-muted-foreground text-xs">
                        Live data
                      </span>
                    </div>
                    <div className="flex flex-col gap-5">
                      {current.topExpenses.map((e) => (
                        <div key={e.label}>
                          <div className="text-sm flex mb-2 justify-between capitalize">
                            <span className="capitalize">{e.label}</span>
                            <span className="text-muted-foreground">{fmt(e.value)}</span>
                          </div>
                          <div className="rounded-full bg-muted h-2">
                            <div
                              className="rounded-full bg-chart-1 h-2"
                              style={{ width: `${maxExpense.gt(0) ? Math.round(e.value.dividedBy(maxExpense).times(100).toNumber()) : 0}%` }}
                            />
                          </div>
                        </div>
                      ))}
                      {current.topExpenses.length === 0 && (
                        <p className="text-muted-foreground text-sm">
                          No categorised debits recorded in this period yet.
                        </p>
                      )}
                    </div>
                  </Card>
                </div>
                <p className="text-muted-foreground text-xs mt-4">
                  Lines are computed deterministically: revenue and taxes come from the DIGITAX GST
                  engine, COGS from purchase invoices, operating expenses from categorised statement
                  debits. DIGITAX prepares statements for human review; it never files to GSTN.
                </p>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

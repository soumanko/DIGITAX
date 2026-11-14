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
  MessageSquare,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
import { AIAssistantWidget } from '@/components/layout/ai-assistant-widget';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pie, PieChart as RechartsPieChart } from 'recharts';
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';
import { formatINR, money, roundMoney } from '@/lib/decimal';

export interface GSTR1SummaryShape {
  period: string;
  b2b: { invoiceCount: number; taxableValue: string; cgst: string; sgst: string; igst: string; totalTax: string };
  b2c_small: { taxableValue: string; cgst: string; sgst: string; igst: string; totalTax: string };
  totalTaxableValue: string;
  totalTax: string;
}

export interface GSTR3BShape {
  period: string;
  outward_supplies: { taxableValue: string; igst: string; cgst: string; sgst: string; cess: string };
  eligible_itc: {
    net_itc_available: { igst: string; cgst: string; sgst: string; cess: string };
  };
  net_tax_payable: { igst: string; cgst: string; sgst: string; cess: string; total: string };
}

interface GSTSummary {
  gstr1: GSTR1SummaryShape;
  gstr3b: GSTR3BShape;
  netTaxPayable: { cgst: string; sgst: string; igst: string; total: string };
  calculationVersion: string;
  rulesetVersion: string;
}

interface PurchaseRow {
  id: string;
  supplier_name?: string | null;
  supplier_gstin?: string | null;
  cgst_amount?: string;
  sgst_amount?: string;
  igst_amount?: string;
  invoice_number: string;
}

interface InvoiceShape {
  id: string;
  invoice_number: string;
  invoice_date: string;
  supplier_name?: string | null;
  supplier_gstin?: string | null;
  buyer_name?: string | null;
  buyer_gstin?: string | null;
  cgst_amount?: string;
  cgst_total?: string;
  sgst_amount?: string;
  sgst_total?: string;
  igst_amount?: string;
  igst_total?: string;
  taxable_value?: string;
  total_amount?: string;
  direction: string;
  invoice_type: string;
}

function fyForToday(now: Date): number {
  // Indian FY runs April–March. FY label year = calendar year of April.
  const t = now.getMonth() + 1; // 1-12
  return t >= 4 ? now.getFullYear() : now.getFullYear() - 1;
}

export default function GSTTax() {
  const router = useRouter();
  const { shop, loading: ctxLoading, error: ctxError, needsOnboarding, userEmail, refresh } = useShopContext();

  // FY starts in April. The approved layout shows five tabs: Apr–Aug of the FY.
  const tabMonths = [4, 5, 6, 7, 8];
  const [fyList, setFyList] = useState<number[]>([]);
  const [fy, setFy] = useState<number | null>(null);
  const [month, setMonth] = useState<number | null>(null);

  // Resolved on the client after mount (never during prerender).
  useEffect(() => {
    let cancelled = false;
    async function init() {
      await Promise.resolve();
      if (cancelled) return;
      const t = new Date();
      const fyNow = fyForToday(t);
      const m = t.getMonth() + 1; // 1-12
      const completedMonth = ((m - 1 + 12) % 12) + 1; // last completed calendar month
      setFyList([fyNow, fyNow - 1]);
      setFy(fyNow);
      setMonth(tabMonths.includes(completedMonth) ? completedMonth : tabMonths[0]);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);
  const [summary, setSummary] = useState<GSTSummary | null>(null);
  const [periodPurchases, setPeriodPurchases] = useState<PurchaseRow[] | null>(null);
  const [periodInvoiceStats, setPeriodInvoiceStats] = useState<{ total: number; complete: number } | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleString('en-IN', { month: 'short' });

  function gstOf(inv: {
    cgst_amount?: string; cgst_total?: string; sgst_amount?: string; sgst_total?: string;
    igst_amount?: string; igst_total?: string;
  }): number {
    const cgst = parseFloat(inv.cgst_amount || inv.cgst_total || '0');
    const sgst = parseFloat(inv.sgst_amount || inv.sgst_total || '0');
    const igst = parseFloat(inv.igst_amount || inv.igst_total || '0');
    return cgst + sgst + igst;
  }

  useEffect(() => {
    if (ctxLoading || fy === null || month === null) return;
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
    setSummary(null);
    setPeriodPurchases(null);
    setPeriodInvoiceStats(null);
    setDataError(null);
      try {
        const [gstRes, invRes] = await Promise.all([
          fetch(`/api/gst/summary?year=${fy}&month=${month}`, { cache: 'no-store' }),
          fetch('/api/invoices?limit=100', { cache: 'no-store' }),
        ]);
        if (cancelled) return;
        const gstData = await gstRes.json().catch(() => null);
        const invData = await invRes.json().catch(() => null);
        if (!gstRes.ok) {
          setDataError(gstData?.error || `GST summary could not be loaded (HTTP ${gstRes.status}).`);
          setSummary(null);
          setPeriodPurchases([]);
          setPeriodInvoiceStats({ total: 0, complete: 0 });
          return;
        }
        setSummary(gstData?.summary ?? null);

        const invoices: InvoiceShape[] = Array.isArray(invData?.invoices) ? invData.invoices : [];
        const periodKey = `${fy}-${String(month).padStart(2, '0')}`;
        const inPeriod = invoices.filter((i) => (i.invoice_date || '').startsWith(periodKey));
        const purchases = inPeriod.filter(
          (i) => i.direction === 'purchase' || i.invoice_type === 'purchase_tax_invoice'
        );
        setPeriodPurchases(purchases);
        const complete = inPeriod.filter(
          (i) =>
            (i.supplier_gstin || i.buyer_gstin) &&
            (parseFloat(String(i.taxable_value || '0').replace(/,/g, '')) || 0) > 0 &&
            gstOf(i) > 0
        ).length;
        setPeriodInvoiceStats({ total: inPeriod.length, complete });
        // eslint-disable-next-line react-hooks/exhaustive-deps
      } catch (err) {
        if (!cancelled) {
          console.error('GST data load error:', err);
          setDataError(err instanceof Error ? err.message : 'Network error while loading GST data.');
          setPeriodPurchases([]);
        }
      }
    }
    if (!ctxLoading) load();
    return () => {
      cancelled = true;
    };
  }, [ctxLoading, shop?.id, fy, month]);

  const itcTotal = summary
    ? roundMoney(
        money(summary.gstr3b.eligible_itc.net_itc_available.cgst || '0')
          .plus(money(summary.gstr3b.eligible_itc.net_itc_available.sgst || '0'))
          .plus(money(summary.gstr3b.eligible_itc.net_itc_available.igst || '0'))
      ).toNumber()
    : 0;
  const outputTax = summary
    ? roundMoney(money(summary.gstr1.totalTax || '0')).toNumber()
    : 0;
  const netPayable = summary
    ? roundMoney(money(summary.gstr3b.net_tax_payable.total || '0')).toNumber()
    : 0;

  const filingHealth = periodInvoiceStats && periodInvoiceStats.total > 0
    ? Math.round((periodInvoiceStats.complete / periodInvoiceStats.total) * 100)
    : null;

  const pieData = [
    { name: 'Output tax', value: outputTax, fill: 'var(--color-chart-1)' },
    { name: 'Input tax credit', value: itcTotal, fill: 'var(--color-chart-2)' },
    { name: 'Net payable', value: netPayable, fill: 'var(--color-chart-3)' },
  ].filter((d) => d.value > 0);

  // Statutory due dates: GSTR-1 due 11th of the following month; GSTR-3B due 20th; TDS 31st.
  const dueThisMonth = (day: number) => {
    if (fy === null || month === null) return '—';
    const d = new Date(fy, month - 1, day);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const due = dueThisMonth;
  const nextMonthDue = (day: number) => {
    if (fy === null || month === null) return '—';
    const d = new Date(fy, month - 1, day);
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const schemeLabel = (() => {
    const scheme = (shop?.taxpayer_scheme || 'regular') as string;
    const map: Record<string, string> = {
      regular: 'Active · Regular',
      composition_goods: 'Active · Composition (goods)',
      composition_services: 'Active · Composition (services)',
      qrmp: 'Active · QRMP',
    };
    return map[scheme] || 'Active · Regular';
  })();

  const hasPeriodData = summary
    ? outputTax > 0 || itcTotal > 0 || roundMoney(money(summary.gstr1.totalTaxableValue || '0')).toNumber() > 0
    : false;

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
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
              <span className="font-medium text-foreground">{`GST & Tax`}</span>
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
                {identityInitials(userEmail)}
              </button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAssistantOpen(true)}
                className="relative"
                aria-label="Open AI Assistant"
              >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5 text-xs font-medium">GNANI</span>
              </Button>
            </div>
          </header>
          <main className="px-8 pt-24 pb-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-semibold text-2xl tracking-tight">{`GST & Tax`}</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Stay ahead of registrations, returns, and input credits.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={fy ? `fy-${fy}` : ''}
                  onValueChange={(v) => setFy(parseInt(v.replace('fy-', ''), 10))}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fyList.map((y) => (
                      <SelectItem key={y} value={`fy-${y}`}>
                        {`FY ${y}–${String((y + 1) % 100).padStart(2, '0')}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={() => router.push('/gst-return-filing')}>
                  Prepare return
                </Button>
              </div>
            </div>

            {ctxError || dataError ? (
              <Card className="mt-8">
                <div className="p-10 text-center">
                  <ReceiptText className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">
                    {ctxError ? 'Could not load your business context.' : dataError}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    GST figures are computed only from your own invoices — no sample data is shown.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => refresh()}>
                    Retry
                  </Button>
                </div>
              </Card>
            ) : ctxLoading || summary === null ? (
              <Card className="mt-8">
                <div className="p-10 text-center">
                  <p className="font-medium text-muted-foreground">Computing GST from your invoices…</p>
                </div>
              </Card>
            ) : needsOnboarding ? (
              <Card className="mt-8">
                <div className="p-10 text-center">
                  <Building2 className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">No business yet</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Complete onboarding to compute GST for your business.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                    Set up business
                  </Button>
                </div>
              </Card>
            ) : (
              <>
                <div className="grid mt-8 gap-4 grid-cols-4">
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-muted-foreground text-sm">Output tax</p>
                      <p className="font-semibold text-xl mt-3">{formatINR(outputTax)}</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {month ? monthName(month) : ''} {fy ?? ''} · live from {summary.gstr1.b2b.invoiceCount} B2B + B2C sales
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-muted-foreground text-sm">
                        Input credit
                      </p>
                      <p className="font-semibold text-xl mt-3">{formatINR(itcTotal)}</p>
                      <p className="text-muted-foreground text-xs mt-1">Net ITC available · {month ? monthName(month) : ''}</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-muted-foreground text-sm">Net payable</p>
                      <p className="font-semibold text-xl mt-3">{formatINR(netPayable)}</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Engine v{summary.calculationVersion} · ruleset v{summary.rulesetVersion}
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-muted-foreground text-sm">
                        Filing health
                      </p>
                      <div className="flex mt-3 justify-between items-end">
                        <p className="font-semibold text-xl">
                          {filingHealth === null ? '—' : `${filingHealth}%`}
                        </p>
                        <span
                          className={
                            filingHealth !== null && filingHealth >= 90
                              ? 'font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1'
                              : 'font-medium rounded-md bg-muted text-muted-foreground text-xs px-2 py-1'
                          }
                        >
                          {filingHealth === null
                            ? 'No period data'
                            : filingHealth >= 90
                              ? 'Good standing'
                              : 'Needs attention'}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-xs mt-1">
                        Share of period invoices with complete GST fields
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid mt-6 gap-6 grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Return calendar</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs value={month ? String(month) : ''} onValueChange={(v) => setMonth(parseInt(v, 10))}>
                        <TabsList className="grid grid-cols-5 w-full">
                          {tabMonths.map((m) => (
                            <TabsTrigger key={m} value={String(m)}>
                              {monthName(m)}
                            </TabsTrigger>
                          ))}
                        </TabsList>
                        {tabMonths.map((m) => (
                          <TabsContent key={m} value={String(m)} className="mt-5">
                            <div className="flex flex-col gap-3">
                              <div className="rounded-md border border-border flex p-4 justify-between items-center">
                                <div>
                                  <p className="font-medium text-sm">GSTR-1</p>
                                  <p className="text-muted-foreground text-xs mt-1">
                                    Due {nextMonthDue(11)}
                                  </p>
                                </div>
                                <span
                                  className={
                                    hasPeriodData
                                      ? 'font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1'
                                      : 'font-medium rounded-md bg-muted text-muted-foreground text-xs px-2 py-1'
                                  }
                                >
                                  {hasPeriodData ? 'Draft ready (not filed)' : 'No data yet'}
                                </span>
                              </div>
                              <div className="rounded-md border border-border flex p-4 justify-between items-center">
                                <div>
                                  <p className="font-medium text-sm">GSTR-3B</p>
                                  <p className="text-muted-foreground text-xs mt-1">
                                    Due {nextMonthDue(20)}
                                  </p>
                                </div>
                                <span
                                  className={
                                    hasPeriodData
                                      ? 'font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1'
                                      : 'font-medium rounded-md bg-muted text-muted-foreground text-xs px-2 py-1'
                                  }
                                >
                                  {hasPeriodData ? 'Draft prepared' : 'In progress'}
                                </span>
                              </div>
                              <div className="rounded-md border border-border flex p-4 justify-between items-center">
                                <div>
                                  <p className="font-medium text-sm">TDS return</p>
                                  <p className="text-muted-foreground text-xs mt-1">
                                    Due {due(31)}
                                  </p>
                                </div>
                                <span className="font-medium rounded-md bg-muted text-muted-foreground text-xs px-2 py-1">
                                  Upcoming
                                </span>
                              </div>
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>GST overview</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {pieData.length === 0 ? (
                        <div className="h-48 flex items-center justify-center">
                          <p className="text-muted-foreground text-sm text-center px-6">
                            No taxable activity recorded for {month ? monthName(month) : '—'} {fy ?? ''}. Records appear as soon as
                            your invoices contain GST data.
                          </p>
                        </div>
                      ) : (
                        <ChartContainer
                          config={{
                            output: {
                              label: 'Output tax',
                              color: 'var(--color-chart-1)',
                            },
                            input: {
                              label: 'Input tax credit',
                              color: 'var(--color-chart-2)',
                            },
                            net: {
                              label: 'Net payable',
                              color: 'var(--color-chart-3)',
                            },
                          }}
                          className="mx-auto w-full h-48"
                        >
                          <RechartsPieChart>
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={52}
                              outerRadius={76}
                            />
                          </RechartsPieChart>
                        </ChartContainer>
                      )}
                      <div className="text-muted-foreground text-xs flex mt-3 justify-center gap-4">
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-chart-1 size-2" />
                          Output tax
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-chart-2 size-2" />
                          Input tax credit
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="rounded-full bg-chart-3 size-2" />
                          Net payable
                        </span>
                      </div>
                      <div className="border-x border-t border-b mt-6 pt-4">
                        <span className="font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1">
                          {schemeLabel}
                        </span>
                        <p className="font-mono text-sm mt-3">
                          {shop?.gstin || 'GSTIN not provided — add it in Settings'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <Card className="mt-6">
                  <CardHeader className="flex flex-row justify-between items-center">
                    <CardTitle>Input tax credit</CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/transactions')}
                    >
                      Review unmatched invoices
                    </Button>
                  </CardHeader>
                  <CardContent>
                    {(periodPurchases || []).length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="font-medium">No purchase invoices this period</p>
                        <p className="text-muted-foreground text-sm mt-1">
                          ITC appears here as soon as purchase invoices with supplier GST data are recorded for
                          your business.
                        </p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Supplier</TableHead>
                            <TableHead>Invoice</TableHead>
                            <TableHead>Amount (tax)</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(periodPurchases || []).slice(0, 5).map((p) => {
                            const eligible = Boolean(p.supplier_gstin);
                            return (
                              <TableRow key={p.id}>
                                <TableCell>{p.supplier_name || 'Unnamed supplier'}</TableCell>
                                <TableCell>{p.invoice_number}</TableCell>
                                <TableCell>{formatINR(gstOf(p))}</TableCell>
                                <TableCell>
                                  {eligible ? (
                                    <span className="text-primary text-sm">Eligible</span>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">
                                      Pending invoice GST details
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
                <p className="text-muted-foreground text-xs mt-4">
                  Figures are computed deterministically by the DIGITAX GST engine from your own invoices.
                  DIGITAX prepares returns for human practitioner review — it never files to GSTN.
                </p>
              </>
            )}
          </main>
        </div>
      </div>
      {/* AI Assistant Widget (accessible from GST page header) */}
      <AIAssistantWidget isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} />
    </div>
  );
}

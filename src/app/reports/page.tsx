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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';

interface InvoiceShape {
  id: string;
  invoice_date?: string;
  direction?: string;
  invoice_type?: string;
}

/** A report row the business can genuinely generate for the selected period. */
interface ReportRow {
  key: string;
  name: string;
  format: string;
  exportType: string;
  generatedAt: string | null; // in-session timestamp or null
}

function fileNameFromHeaders(headers: Headers, fallback: string): string {
  const disposition = headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  return match ? match[1] : fallback;
}

export default function Reports() {
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
  const [transactions, setTransactions] = useState<null | unknown[]>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null); // export key being downloaded
  const [generatedAt, setGeneratedAt] = useState<Record<string, string>>({});

  // Last 12 completed months — computed on the client after mount (never during prerender).
  const [monthOptions, setMonthOptions] = useState<
    Array<{ key: string; year: number; month: number; label: string }>
  >([]);
  const [period, setPeriod] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await Promise.resolve();
      if (cancelled) return;
      const base = new Date(); // effect-time current month
      const options: Array<{ key: string; year: number; month: number; label: string }> = [];
      for (let i = 1; i <= 12; i++) {
        const d = new Date(base.getFullYear(), base.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        options.push({
          key,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          label: d.toLocaleString('en-IN', { month: 'short', year: 'numeric' }),
        });
      }
      setMonthOptions(options);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the selection valid once options are known.
  useEffect(() => {
    let cancelled = false;
    async function normalize() {
      await Promise.resolve();
      if (cancelled) return;
      if (!period) {
        setPeriod(monthOptions[0]?.key || '');
        return;
      }
      if (monthOptions.length && !monthOptions.some((o) => o.key === period)) {
        setPeriod(monthOptions[0].key);
      }
    }
    normalize();
    return () => {
      cancelled = true;
    };
  }, [monthOptions, period]);

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
            invData?.error || txnData?.error || 'Reports data could not be loaded right now.'
          );
          setInvoices([]);
          setTransactions([]);
          return;
        }
        setInvoices(Array.isArray(invData?.invoices) ? invData.invoices : []);
        setTransactions(Array.isArray(txnData?.transactions) ? txnData.transactions : []);
      } catch {
        if (!cancelled) {
          setDataError('Network error while loading reports data.');
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

  const periodMonths = useMemo(() => {
    const set = new Set(
      (invoices || []).map((i) => (i.invoice_date || '').slice(0, 7)).filter(Boolean)
    );
    for (const t of (transactions || []) as Array<{ transaction_date?: string }>) {
      if (t.transaction_date) set.add(t.transaction_date.slice(0, 7));
    }
    return set;
  }, [invoices, transactions]);

  // Months that actually contain this business's records; empty businesses show the default period only.
  const dataPeriods = useMemo(
    () => monthOptions.filter((o) => periodMonths.has(o.key)),
    [monthOptions, periodMonths]
  );
  const selectable = dataPeriods.length > 0 ? dataPeriods : monthOptions.slice(0, 3);

  const selectedOption = selectable.find((o) => o.key === period) || selectable[0] || null;

  const periodLabel = selectedOption ? selectedOption.label : '—';

  const hasPeriodData = selectedOption ? periodMonths.has(selectedOption.key) : false;

  const reports: ReportRow[] = useMemo(
    () => [
      {
        key: 'gstr3b_csv',
        name: 'GST liability summary',
        format: 'CSV',
        exportType: 'gstr3b_csv',
        generatedAt: generatedAt['gstr3b_csv'] || null,
      },
      {
        key: 'gstr1_json',
        name: 'GSTR-1 outward supplies',
        format: 'JSON',
        exportType: 'gstr1_json',
        generatedAt: generatedAt['gstr1_json'] || null,
      },
    ],
    [generatedAt]
  );

  async function download(type: string, name: string) {
    if (!selectedOption || importing) return;
    setImporting(type);
    try {
      const res = await fetch(
        `/api/exports?type=${type}&year=${selectedOption.year}&month=${selectedOption.month}`,
        { cache: 'no-store' }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const message = body?.error || `Export failed (HTTP ${res.status}).`;
        alert(message);
        return;
      }
      const blob = await res.blob();
      const filename = fileNameFromHeaders(res.headers, `${type}_${selectedOption.key}`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setGeneratedAt((m) => ({ ...m, [type]: 'Just now' }));
    } catch {
      alert('Network error while generating the export. Nothing was downloaded.');
    } finally {
      setImporting(null);
    }
  }

  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground min-h-screen h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
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
              <span className="font-medium text-foreground">Reports</span>
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
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-2">
                <h1 className="font-semibold text-2xl tracking-tight">
                  Reports
                </h1>
                <p className="text-muted-foreground text-sm">
                  Turn your books into decisions.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={period}
                  onValueChange={(v) => setPeriod(v)}
                  disabled={selectable.length === 0}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectable.map((o) => (
                      <SelectItem key={o.key} value={o.key}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  disabled={!selectedOption || !hasPeriodData || Boolean(importing)}
                  onClick={() => download('gstr3b_csv', 'GST liability summary')}
                  title={
                    selectedOption && !hasPeriodData
                      ? 'No records for this period yet — exports contain only your own figures'
                      : 'Downloads the GST liability summary (GSTR-3B) for the selected period'
                  }
                >
                  Export report
                </Button>
              </div>
            </div>

            {ctxError || dataError ? (
              <Card className="mt-8">
                <CardContent className="p-10 text-center">
                  <BarChart3 className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">
                    {ctxError ? 'Could not load your business context.' : dataError}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Reports are generated only from this business&apos;s own records.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => refresh()}>
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : ctxLoading || invoices === null || transactions === null ? (
              <Card className="mt-8">
                <CardContent className="p-10 text-center">
                  <p className="font-medium text-muted-foreground">Loading your reports…</p>
                </CardContent>
              </Card>
            ) : needsOnboarding ? (
              <Card className="mt-8">
                <CardContent className="p-10 text-center">
                  <Building2 className="text-muted-foreground size-10 mx-auto" />
                  <p className="font-medium mt-4">No business yet</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Complete onboarding to generate reports for your business.
                  </p>
                  <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                    Set up business
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid mt-8 gap-6 grid-cols-3">
                  <Card>
                    <CardHeader>
                      <CardTitle>{`Profit & Loss`}</CardTitle>
                      <CardDescription>
                        Revenue, expenses, and net profit
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md bg-muted flex p-4 items-end gap-3 h-28">
                        <div className="rounded-xs bg-chart-1/40 flex-1 h-10" />
                        <div className="rounded-xs bg-chart-1/60 flex-1 h-16" />
                        <div className="rounded-xs bg-chart-1/75 flex-1 h-12" />
                        <div className="rounded-xs bg-chart-1 flex-1 h-24" />
                        <div className="rounded-xs bg-chart-1/80 flex-1 h-20" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => router.push('/profit-&-loss')}
                      >
                        {hasPeriodData ? 'Open report' : 'Open report (awaiting data)'}
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Balance Sheet</CardTitle>
                      <CardDescription>
                        Assets, liabilities, and equity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md bg-muted flex p-4 flex-col justify-end gap-2 h-28">
                        <div className="rounded-xs bg-chart-2 w-4/5 h-7" />
                        <div className="rounded-xs bg-chart-3 w-3/5 h-5" />
                        <div className="rounded-xs bg-chart-4 w-2/5 h-4" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        variant="outline"
                        className="w-full"
                        disabled
                        title="A dedicated Balance Sheet statement is not part of the current DIGITAX release — track balances in Banking and P&L meanwhile."
                      >
                        Open report
                      </Button>
                    </CardFooter>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Cash flow statement</CardTitle>
                      <CardDescription>
                        Money in, money out, and runway
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md bg-muted relative p-4 h-28 overflow-hidden">
                        <div className="rotate-12 bg-chart-1 absolute bottom-8 left-4 w-10 h-px" />
                        <div className="-rotate-12 bg-chart-1 absolute bottom-10 left-12 w-12 h-px" />
                        <div className="rotate-6 bg-chart-1 absolute bottom-5 left-24 w-12 h-px" />
                        <div className="-rotate-12 bg-chart-1 absolute bottom-8 left-36 w-10 h-px" />
                        <div className="rounded-full bg-chart-1 absolute bottom-5 left-44 size-2" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => router.push('/cash-flow')}
                      >
                        {hasPeriodData ? 'Open report' : 'Open report (awaiting data)'}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Saved reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <table className="text-left text-sm w-full">
                      <thead>
                        <tr className="text-muted-foreground border-t border-r border-b border-b-border border-l-border">
                          <th className="font-medium pb-3">Report</th>
                          <th className="font-medium pb-3">Period</th>
                          <th className="font-medium pb-3">Last generated</th>
                          <th className="font-medium pb-3">Owner</th>
                          <th className="font-medium pb-3">Format</th>
                          <th className="pb-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {reports.map((r) => (
                          <tr
                            key={r.key}
                            className="border-t border-r border-b border-b-border border-l-border"
                          >
                            <td className="font-medium py-4">{r.name}</td>
                            <td className="text-muted-foreground py-4">{periodLabel}</td>
                            <td className="text-muted-foreground py-4">
                              {r.generatedAt || 'Not generated yet'}
                            </td>
                            <td className="py-4">{userEmail || 'Signed-in user'}</td>
                            <td className="py-4">{r.format}</td>
                            <td className="py-4">
                              <div className="flex justify-end gap-1">
                                <button
                                  aria-label={`Download ${r.name}`}
                                  className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                                  title={
                                    hasPeriodData
                                      ? `Generate and download ${r.name} (${r.format})`
                                      : 'No records for this period yet'
                                  }
                                  disabled={!hasPeriodData || importing !== null}
                                  onClick={() => download(r.exportType, r.name)}
                                >
                                  <Download className="size-4" />
                                </button>
                                <button
                                  aria-label={`More options for ${r.name}`}
                                  className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                                >
                                  <MoreHorizontal className="size-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {reports.length === 0 && (
                      <p className="text-muted-foreground text-sm py-8 text-center">
                        Exports appear here once the business has GST-period records.
                      </p>
                    )}
                  </CardContent>
                </Card>
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Report schedule</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">
                          Monthly management pack
                        </p>
                        <p className="text-muted-foreground text-sm mt-1">
                          On-demand export · Email scheduling is not available yet
                        </p>
                      </div>
                      <label
                        title="Scheduled email delivery is not available in this release — generate exports on demand. The switch is kept as a preview of the planned feature."
                      >
                        <Switch defaultChecked={false} disabled />
                      </label>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/team-activity')}
                    >
                      Manage schedules
                    </Button>
                  </CardFooter>
                </Card>
                <p className="text-muted-foreground text-xs mt-4">
                  Exports are generated deterministically from this business&apos;s own invoices and
                  transactions — no sample rows are ever inserted. DIGITAX prepares reports for
                  practitioner review; it never files to GSTN.
                </p>
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

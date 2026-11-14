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
  Info,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  SearchX,
  Settings,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';
import { formatINR, money } from '@/lib/decimal';
import Decimal from 'decimal.js';

interface GstSummaryShape {
  calculationVersion: string;
  rulesetVersion: string;
  gstr3b: {
    outward_supplies: { taxableValue: string; igst: string; cgst: string; sgst: string; cess: string };
    eligible_itc: {
      net_itc_available: { igst: string; cgst: string; sgst: string; cess: string };
    };
  };
  netTaxPayable: { cgst: string; sgst: string; igst: string; total: string };
}

interface InvoiceShape {
  id: string;
  invoice_number: string;
  supplier_name?: string | null;
  supplier_gstin?: string | null;
  buyer_name?: string | null;
  buyer_gstin?: string | null;
  taxable_value?: string;
  total_amount?: string;
  payment_status?: string;
  invoice_date: string;
  direction?: string;
  invoice_type?: string;
}

interface CheckRow {
  label: string;
  state: boolean;
  note: string; // honest note about what drives the state
  checked: boolean; // false = requires manual review (incomplete)
}

function monthLabel(year: number, month: number): string {
  return `${new Date(year, month - 1, 1).toLocaleString('en-IN', { month: 'long' })} ${year}`;
}

export default function GSTReturnFiling() {
  const router = useRouter();
  const {
    shop,
    loading: ctxLoading,
    error: ctxError,
    needsOnboarding,
    userEmail,
    refresh,
  } = useShopContext();

  // 12month options ending at the last completed month — computed on the client
  // after mount (never during prerender).
  const [monthOptions, setMonthOptions] = useState<
    Array<{ key: string; year: number; month: number; label: string }>
  >([]);
  const [period, setPeriod] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function init() {
      await Promise.resolve();
      if (cancelled) return;
      const today = new Date();
      const lastCompletedDate = new Date(today.getFullYear(), today.getMonth(), 1);
      lastCompletedDate.setDate(0); // last day of the previous month
      const lastCompleted = {
        year: lastCompletedDate.getFullYear(),
        month: lastCompletedDate.getMonth() + 1,
      };
      const options: Array<{ key: string; year: number; month: number; label: string }> = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(lastCompleted.year, lastCompleted.month - 1 - i, 1);
        options.push({
          key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          label: monthLabel(d.getFullYear(), d.getMonth() + 1),
        });
      }
      setMonthOptions(options);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);
  const [summary, setSummary] = useState<GstSummaryShape | null>(null);
  const [invoices, setInvoices] = useState<InvoiceShape[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);

  const selectedMonth = monthOptions.find((o) => o.key === period) || monthOptions[0];
  const periodKey = selectedMonth ? selectedMonth.key : '';

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
      setSummary(null);
      setInvoices(null);
      setDataError(null);
      const [y, m] = (selectedMonth ? [selectedMonth.year, selectedMonth.month] : [new Date().getFullYear(), new Date().getMonth() + 1]);
      try {
        const [gstRes, invRes] = await Promise.all([
          fetch(`/api/gst/summary?year=${y}&month=${m}`, { cache: 'no-store' }),
          fetch('/api/invoices?limit=100', { cache: 'no-store' }),
        ]);
        if (cancelled) return;
        const gstData = await gstRes.json().catch(() => null);
        const invData = await invRes.json().catch(() => null);
        if (!gstRes.ok) {
          setDataError(gstData?.error || `GST data could not be loaded (HTTP ${gstRes.status}).`);
          setInvoices([]);
          return;
        }
        setSummary(gstData?.summary ?? null);
        setInvoices(Array.isArray(invData?.invoices) ? invData.invoices : []);
      } catch {
        if (!cancelled) {
          setDataError('Network error while loading the GSTR-3B drafts.');
          setInvoices([]);
        }
      }
    }
    if (!ctxLoading) load();
    return () => {
      cancelled = true;
    };
  }, [ctxLoading, shop?.id, periodKey]);

  const periodInvoices = useMemo(() => {
    return (invoices || []).filter((i) => (i.invoice_date || '').startsWith(periodKey));
  }, [invoices, periodKey]);

  const salesInPeriod = useMemo(
    () =>
      periodInvoices.filter(
        (i) => i.direction === 'sales' || i.invoice_type === 'sales_tax_invoice'
      ),
    [periodInvoices]
  );
  const purchaseInPeriod = useMemo(
    () =>
      periodInvoices.filter(
        (i) => i.direction === 'purchase' || i.invoice_type === 'purchase_tax_invoice'
      ),
    [periodInvoices]
  );

  // Return checks derived from the business's actual records.
  const checks = useMemo<CheckRow[]>(() => {
    const salesComplete =
      salesInPeriod.every(
        (i) =>
          Boolean(i.buyer_gstin) &&
          parseFloat((i.taxable_value || '0').toString().replace(/,/g, '')) > 0
      ) && salesInPeriod.length > 0;
    const itcComplete =
      purchaseInPeriod.every((i) => Boolean(i.supplier_gstin)) &&
      purchaseInPeriod.length > 0;
    const matchedShare = (rows: InvoiceShape[]) =>
      rows.length > 0 && rows.every((i) => (i.payment_status || 'unpaid') === 'paid');
    return [
      {
        label: 'Sales invoices carry complete GST fields',
        state: salesComplete,
        checked: salesComplete,
        note:
          salesInPeriod.length === 0
            ? 'No sales invoices recorded for this period yet.'
            : salesComplete
              ? `${salesInPeriod.length} sales invoices have buyer GSTIN and taxable values.`
              : 'Some sales invoices are missing buyer GSTIN or taxable value — fix them on the invoice record.',
      },
      {
        label: 'Purchase ITC ready',
        state: itcComplete,
        checked: itcComplete,
        note:
          purchaseInPeriod.length === 0
            ? 'No purchase invoices recorded for this period yet.'
            : itcComplete
              ? `${purchaseInPeriod.length} purchase invoices carry supplier GSTIN.`
              : 'Purchase invoices missing supplier GSTIN cannot contribute ITC.',
      },
      {
        label: 'Payments reconciled',
        state: matchedShare(salesInPeriod),
        checked: matchedShare(salesInPeriod),
        note: matchedShare(salesInPeriod)
          ? 'All sales invoices for this period are marked paid.'
          : 'Open sales invoices remain — link payments during reconciliation.',
      },
      {
        label: 'Reverse charge reviewed',
        state: false,
        checked: false,
        note: 'No reverse-charge records are captured in this release — review RCM-liable purchases manually before filing.',
      },
      {
        label: 'Filing period locked',
        state: false,
        checked: false,
        note: 'The practitioner confirms the filing lock at export; DIGITAX prepares returns for human review and never files to GSTN.',
      },
    ];
  }, [salesInPeriod, purchaseInPeriod]);

  const incomplete = checks.filter((c) => !c.state).length;

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
                <span className="text-muted-foreground">{`GST & Tax`}</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="font-medium text-foreground">GSTR-3B</span>
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
              </div>
            </header>
            <main className="px-8 pt-24 pb-8">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="font-semibold text-2xl">
                      GSTR-3B · {selectedMonth ? selectedMonth.label : '—'}
                    </h1>
                    <Badge variant="secondary">Draft — not filed</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">
                    Review figures before your practitioner exports the return.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value={period} onValueChange={(v) => setPeriod(v)}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((o) => (
                        <SelectItem key={o.key} value={o.key}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    disabled
                    title="Saving drafts to a table is not wired in this release — download the GSTR-3B summary from the Reports page instead."
                  >
                    Save draft
                  </Button>
                  <Button
                    disabled
                    title="DIGITAX prepares returns for human CA review — it never files to the GST portal, and no filing action exists."
                  >
                    Mark ready to file
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
                    <Button className="mt-4 h-9" onClick={() => refresh()}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : ctxLoading || summary === null || invoices === null ? (
                <Card className="mt-6">
                  <CardContent className="p-10 text-center">
                    <p className="font-medium text-muted-foreground">
                      Computing the GSTR-3B draft…
                    </p>
                  </CardContent>
                </Card>
              ) : needsOnboarding ? (
                <Card className="mt-6">
                  <CardContent className="p-10 text-center">
                    <Building2 className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">No business yet</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Complete onboarding to prepare returns for your business.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                      Set up business
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Tabs defaultValue="prepare" className="mt-8">
                    <TabsList className="grid grid-cols-3 w-full max-w-xl">
                      <TabsTrigger value="prepare">Prepare</TabsTrigger>
                      <TabsTrigger value="review">Review</TabsTrigger>
                      <TabsTrigger value="file">File</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <div className="grid mt-6 gap-6 grid-cols-3">
                    <Card className="col-span-2">
                      <CardHeader>
                        <CardTitle>Tax summary</CardTitle>
                        <CardDescription>
                          Computed by the DIGITAX GST engine from this business&apos;s invoices.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            Outward taxable supplies
                            <Info className="text-muted-foreground size-4" />
                          </span>
                          <span className="font-medium text-sm">
                            {formatINR(summary.gstr3b.outward_supplies.taxableValue || '0')}
                          </span>
                        </div>
                        <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            Integrated tax
                            <Info className="text-muted-foreground size-4" />
                          </span>
                          <span className="font-medium text-sm">
                            {formatINR(summary.gstr3b.outward_supplies.igst || '0')}
                          </span>
                        </div>
                        <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            Central tax
                            <Info className="text-muted-foreground size-4" />
                          </span>
                          <span className="font-medium text-sm">
                            {formatINR(summary.gstr3b.outward_supplies.cgst || '0')}
                          </span>
                        </div>
                        <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            State tax
                            <Info className="text-muted-foreground size-4" />
                          </span>
                          <span className="font-medium text-sm">
                            {formatINR(summary.gstr3b.outward_supplies.sgst || '0')}
                          </span>
                        </div>
                        <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                          <span className="text-sm flex items-center gap-2">
                            Eligible ITC (net)
                            <Info className="text-muted-foreground size-4" />
                          </span>
                          <span className="font-medium text-sm">
                            -{formatINR(
                              money(summary.gstr3b.eligible_itc.net_itc_available.cgst || '0')
                                .plus(money(summary.gstr3b.eligible_itc.net_itc_available.sgst || '0'))
                                .plus(money(summary.gstr3b.eligible_itc.net_itc_available.igst || '0'))
                            )}
                          </span>
                        </div>
                        <div className="flex pt-4 justify-between items-center">
                          <span className="font-semibold text-sm">
                            Net tax payable
                          </span>
                          <span className="font-semibold text-primary text-base">
                            {formatINR(summary.netTaxPayable?.total || '0')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle>Return checks</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {checks.map((c) => (
                          <label
                            key={c.label}
                            className="flex mb-4 items-center gap-3"
                            title={c.note}
                          >
                            <Checkbox defaultChecked={c.checked} disabled />
                            <span className="text-sm flex-1">{c.label}</span>
                            {c.state ? (
                              <Badge variant="secondary">Complete</Badge>
                            ) : (
                              <Badge variant="outline">Incomplete</Badge>
                            )}
                          </label>
                        ))}
                        <Button
                          className="mt-2 w-full"
                          disabled
                          title="Issue resolution happens on the Review screen against this business's open review_issues."
                        >
                          Resolve issues
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Source invoices</CardTitle>
                      <CardDescription>
                        Invoices recorded by this business for {selectedMonth?.label}.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {periodInvoices.length === 0 ? (
                        <div className="py-10 text-center">
                          <SearchX className="text-muted-foreground size-8 mx-auto" />
                          <p className="font-medium mt-3">
                            No invoices for {selectedMonth?.label}
                          </p>
                          <p className="text-muted-foreground text-sm mt-1">
                            The draft fills from this business&apos;s own invoices only — never from
                            sample data or another account.
                          </p>
                        </div>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Invoice</TableHead>
                              <TableHead>Party</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead className="text-right">
                                Taxable value
                              </TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {periodInvoices.slice(0, 8).map((inv) => {
                              const isPurchase =
                                inv.direction === 'purchase' ||
                                inv.invoice_type === 'purchase_tax_invoice';
                              const paid = (inv.payment_status || 'unpaid') === 'paid';
                              const status = isPurchase
                                ? inv.supplier_gstin
                                  ? 'ITC ready'
                                  : 'Needs review'
                                : paid
                                  ? 'Reconciled'
                                  : 'Needs review';
                              return (
                                <TableRow key={inv.id}>
                                  <TableCell className="font-mono text-xs">
                                    {inv.invoice_number}
                                  </TableCell>
                                  <TableCell>
                                    {(isPurchase
                                      ? inv.supplier_name
                                      : inv.buyer_name) || 'Unnamed party'}
                                  </TableCell>
                                  <TableCell>
                                    {inv.invoice_date
                                      ? new Date(inv.invoice_date).toLocaleDateString('en-IN', {
                                          day: '2-digit',
                                          month: 'short',
                                          year: 'numeric',
                                        })
                                      : '—'}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {formatINR(inv.taxable_value || invo_total(inv))}
                                  </TableCell>
                                  <TableCell>
                                    {status === 'Needs review' ? (
                                      <Badge variant="outline">Needs review</Badge>
                                    ) : status === 'Reconciled' ? (
                                      <Badge variant="secondary">Reconciled</Badge>
                                    ) : (
                                      <Badge variant="secondary">ITC ready</Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                    <CardFooter className="border-x border-t border-b">
                      <div className="text-muted-foreground text-sm flex items-center gap-2">
                        <TriangleAlert className="text-destructive size-4" />
                        {incomplete > 0
                          ? `${incomplete} check${incomplete === 1 ? '' : 's'} need attention before this return can be handed to your practitioner.`
                          : 'All checks complete — hand the draft to your practitioner for review and export.'}
                      </div>
                    </CardFooter>
                  </Card>
                  <p className="text-muted-foreground text-xs mt-4">
                    Figures come from engine version {summary.calculationVersion}, ruleset{' '}
                    {summary.rulesetVersion}, restricted to this business. DIGITAX never files to
                    GSTN — the return is prepared for practitioner review.
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

function invo_total(inv: InvoiceShape): string {
  return inv.total_amount || '0';
}

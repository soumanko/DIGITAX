'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
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
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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

interface ReconciliationSuggestion {
  invoice: {
    id: string;
    invoice_number: string;
    invoice_type?: string;
    direction?: string;
    supplier_name?: string | null;
    buyer_name?: string | null;
    outstanding_balance?: string;
    amount_due?: string;
    total_amount: string;
  };
  transaction: {
    id: string;
    description?: string;
    transaction_date?: string;
    direction: string;
    amount: string;
    bank_account_name?: string;
    source_account?: string;
    category?: string | null;
  };
  suggestedMatchAmount: string;
  confidenceScore: number;
  matchReasons: string[];
  matchType: string;
}

interface LedgerTransaction {
  id: string;
  description?: string;
  transaction_date?: string;
  direction: string;
  amount: string;
  bank_account_name?: string;
  source_account?: string;
  category?: string | null;
  sub_category?: string | null;
  reconciliation_status: string;
}

export default function Reconciliation() {
  const router = useRouter();
  const {
    shop,
    loading: ctxLoading,
    error: ctxError,
    needsOnboarding,
    userEmail,
    refresh,
  } = useShopContext();
  const [suggestions, setSuggestions] = useState<ReconciliationSuggestion[] | null>(null);
  const [transactions, setTransactions] = useState<LedgerTransaction[] | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [accountFilter, setAccountFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
    setSuggestions(null);
    setTransactions(null);
    setDataError(null);
      try {
        const [reconRes, txnRes] = await Promise.all([
          fetch('/api/reconciliation', { cache: 'no-store' }),
          fetch('/api/transactions?limit=100', { cache: 'no-store' }),
        ]);
        if (cancelled) return;
        const reconData = await reconRes.json().catch(() => null);
        const txnData = await txnRes.json().catch(() => null);
        if (!reconRes.ok || !txnRes.ok) {
          setDataError(
            reconData?.error || txnData?.error || 'The reconciliation queue could not be loaded right now.'
          );
          setSuggestions([]);
          setTransactions([]);
          return;
        }
        setSuggestions(Array.isArray(reconData?.suggestions) ? reconData.suggestions : []);
        setTransactions(Array.isArray(txnData?.transactions) ? txnData.transactions : []);
      } catch {
        if (!cancelled) {
          setDataError('Network error while loading the reconciliation queue.');
          setSuggestions([]);
          setTransactions([]);
        }
      }
    }
    if (!ctxLoading) load();
    return () => {
      cancelled = true;
    };
  }, [ctxLoading, shop?.id, successMessage]);

  const accounts = useMemo(
    () =>
      Array.from(
        new Set((transactions || []).map((t) => t.bank_account_name || t.source_account || '').filter(Boolean))
      ),
    [transactions]
  );
  const periods = useMemo(
    () =>
      Array.from(
        new Set(
          (transactions || [])
            .map((t) => {
              const d = t.transaction_date ? new Date(t.transaction_date) : null;
              return d && !isNaN(d.getTime())
                ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
                : '';
            })
            .filter(Boolean)
        )
      ).sort().reverse(),
    [transactions]
  );

  const unmatched = useMemo(
    () => (transactions || []).filter((t) => t.reconciliation_status !== 'matched'),
    [transactions]
  );

  const filteredUnmatched = useMemo(() => {
    let rows = unmatched;
    if (accountFilter !== 'all') {
      rows = rows.filter((t) => (t.bank_account_name || t.source_account || '') === accountFilter);
    }
    if (periodFilter !== 'all') {
      rows = rows.filter((t) => {
        const d = t.transaction_date ? new Date(t.transaction_date) : null;
        const key = d && !isNaN(d.getTime())
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          : '';
        return key === periodFilter;
      });
    }
    return rows;
  }, [unmatched, accountFilter, periodFilter]);

  const selectedSuggestions = useMemo(
    () => (suggestions || []).filter((s) => s.transaction.id === selectedTxnId),
    [suggestions, selectedTxnId]
  );
  const best = selectedSuggestions[0] || null;
  const selectedTxn =
    filteredUnmatched.find((t) => t.id === selectedTxnId) ||
    unmatched.find((t) => t.id === selectedTxnId) ||
    null;

  const accountsLabel = (t: { bank_account_name?: string; source_account?: string }) =>
    t.bank_account_name || t.source_account || '—';

  const fmtDate = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
  };

  const periodLabel = (key: string) => {
    const [y, m] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
  };

  const counterpartyLabel = (s: ReconciliationSuggestion) => {
    const dir = s.invoice.direction || (s.invoice.invoice_type === 'purchase_tax_invoice' ? 'purchase' : 'sales');
    return dir === 'purchase' ? s.invoice.supplier_name : s.invoice.buyer_name;
  };

  async function confirmMatch() {
    if (!best || confirming) return;
    setConfirming(true);
    setActionError(null);
    try {
      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: best.transaction.id,
          invoice_id: best.invoice.id,
          allocated_amount: best.suggestedMatchAmount,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.ok) {
        setSuccessMessage(
          `Transaction matched successfully. ${formatINR(best.suggestedMatchAmount)} reconciled against invoice ${best.invoice.invoice_number}.`
        );
        setSelectedTxnId(null);
        refresh();
      } else {
        setActionError(
          data?.error || `The server could not confirm this match (HTTP ${res.status}). Nothing was changed.`
        );
      }
    } catch {
      setActionError('Network error while confirming the match. Nothing was changed.');
    } finally {
      setConfirming(false);
    }
  }

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
                <span className="text-muted-foreground">Banking</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="font-medium text-foreground">
                  Reconciliation
                </span>
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
                  <h1 className="font-semibold text-2xl tracking-tight">
                    Reconciliation
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Match your books to the bank statement.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select
                    value={accountFilter}
                    onValueChange={(v) => setAccountFilter(v)}
                  >
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="All accounts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All accounts</SelectItem>
                      {accounts.map((a) => (
                        <SelectItem key={a} value={a} className="max-w-56">
                          <span className="truncate block">{a}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={periodFilter}
                    onValueChange={(v) => setPeriodFilter(v)}
                  >
                    <SelectTrigger className="w-36">
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
                  <Button onClick={() => router.push('/banking')}>
                    Finish review
                  </Button>
                </div>
              </div>
              {successMessage && (
                <div className="rounded-md bg-primary/10 text-primary text-sm border border-primary/30 flex mt-6 px-4 py-3 items-center gap-3">
                  <CheckCircle2 className="size-4" />
                  <span>{successMessage}</span>
                </div>
              )}
              {actionError && (
                <div className="rounded-md bg-destructive/10 text-destructive text-sm border border-destructive/30 flex mt-6 px-4 py-3 items-center gap-3">
                  <AlertCircle className="size-4" />
                  <span>{actionError}</span>
                </div>
              )}

              {ctxError || dataError ? (
                <Card className="mt-8">
                  <div className="p-10 text-center">
                    <AlertCircle className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">
                      {ctxError ? 'Could not load your business context.' : dataError}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Nothing is being displayed from another account — this view loads only your own records.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => refresh()}>
                      Retry
                    </Button>
                  </div>
                </Card>
              ) : ctxLoading || suggestions === null || transactions === null ? (
                <Card className="mt-8">
                  <div className="p-10 text-center">
                    <p className="font-medium text-muted-foreground">Loading reconciliation queue…</p>
                  </div>
                </Card>
              ) : needsOnboarding ? (
                <Card className="mt-8">
                  <div className="p-10 text-center">
                    <Building2 className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">No business yet</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Complete onboarding to reconcile transactions against your invoices.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                      Set up business
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid mt-8 gap-6 grid-cols-5">
                  <Card className="col-span-2 overflow-hidden">
                    <div className="border-t border-r border-b border-b-border border-l-border px-5 py-4">
                      <h2 className="font-medium">
                        {filteredUnmatched.length} transaction{filteredUnmatched.length === 1 ? '' : 's'} need
                        review
                      </h2>
                    </div>
                    <div className="flex flex-col">
                      {filteredUnmatched.length === 0 ? (
                        <div className="px-5 py-10 text-center">
                          <CheckCircle2 className="text-muted-foreground size-8 mx-auto" />
                          <p className="font-medium mt-3">All bank movements are matched</p>
                          <p className="text-muted-foreground text-sm mt-1">
                            No transactions are awaiting reconciliation for this business.
                          </p>
                        </div>
                      ) : (
                        <>
                          {(() => {
                            const rows = filteredUnmatched.slice(0, 8);
                            return rows.map((t, idx) => (
                              <button
                                key={t.id}
                                className={
                                  idx === 0
                                    ? 'text-left border-t border-r border-b border-b-border border-l-border flex px-5 py-4 flex-col gap-2 hover:bg-accent'
                                    : 'text-left border-t border-r border-b border-b-border border-l-border flex px-5 py-4 flex-col gap-2 hover:bg-accent'
                                }
                                onClick={() => {
                                  setSelectedTxnId(t.id === selectedTxnId ? null : t.id);
                                  setSuccessMessage(null);
                                  setActionError(null);
                                }}
                                title={
                                  (suggestions || []).some((s) => s.transaction.id === t.id)
                                    ? `${(suggestions || []).filter((s) => s.transaction.id === t.id).length} suggested match(es) available`
                                    : 'No suggested invoice match yet — upload the corresponding invoice to review it'
                                }
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-sm">{t.description || 'Transaction'}</span>
                                  <span className="font-medium text-sm">
                                    {t.direction === 'credit' ? '+' : '−'}
                                    {formatINR(t.amount)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-muted-foreground text-xs">
                                    {fmtDate(t.transaction_date)}
                                  </span>
                                  <span className="rounded-sm bg-muted text-muted-foreground text-xs px-2 py-0.5">
                                    {(suggestions || []).some((s) => s.transaction.id === t.id)
                                      ? 'Suggested match ready'
                                      : 'Needs review'}
                                  </span>
                                </div>
                              </button>
                            ));
                          })()}
                          {filteredUnmatched.length > 8 ? (
                            <div className="px-5 py-4 border-t border-r border-b border-b-border border-l-border">
                              <span className="text-muted-foreground text-xs">
                                Showing 8 of {filteredUnmatched.length} — data is live from your bank imports
                              </span>
                            </div>
                          ) : null}
                          <div className="border-x border-t border-b flex px-5 py-3">
                            <span className="text-muted-foreground text-xs">
                              Live data · synced from your business records
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </Card>
                  <Card className="p-6 col-span-3">
                    {selectedTxn && (
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h2 className="font-semibold text-lg">
                              {selectedTxn.description || 'Transaction'}
                            </h2>
                            <p className="font-semibold text-2xl mt-1">
                              {selectedTxn.direction === 'credit' ? '+' : '−'}
                              {formatINR(selectedTxn.amount)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground text-xs">Bank date</p>
                            <p className="font-medium text-sm mt-1">
                              {fmtDate(selectedTxn.transaction_date)}
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              {accountsLabel(selectedTxn)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-8">
                          <h3 className="font-medium text-sm">Suggested match</h3>
                          {best ? (
                            <>
                              <div className="rounded-md bg-muted/40 border border-border mt-3 p-4">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="font-medium text-sm">
                                      {counterpartyLabel(best) || 'Counterparty'} ·{' '}
                                      {best.invoice.direction || 'invoice'}
                                    </p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                      Invoice {best.invoice.invoice_number}
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-medium text-sm">
                                      {formatINR(best.suggestedMatchAmount)}
                                    </p>
                                    <p className="text-primary text-xs mt-1">
                                      {Math.round(best.confidenceScore * 100)}% confidence
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-2 flex flex-col gap-1">
                                  {best.matchReasons.slice(0, 3).map((r, i) => (
                                    <span
                                      key={i}
                                      className="text-muted-foreground text-xs"
                                    >
                                      · {r}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex mt-4 gap-3">
                                <Button onClick={confirmMatch} disabled={confirming} isLoading={confirming}>
                                  {confirming ? 'Confirming…' : 'Match transaction'}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() => router.push('/expense-capture')}
                                >
                                  Create new expense
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="rounded-md bg-muted/40 border border-border mt-3 p-4">
                              <p className="text-muted-foreground text-sm">
                                No suggested invoice match yet for this transaction. Upload the corresponding
                                invoice in Documents or create the expense, then return here — the engine will
                                propose the match from your live data.
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="border-x border-t border-b mt-8 pt-6">
                          <h3 className="font-medium text-sm">Split or categorize</h3>
                          <div className="grid mt-4 gap-4 grid-cols-2">
                            <label className="text-sm flex flex-col gap-2" title="Category editing requires the transaction update API — available on request. Your imported category is shown.">
                              <span className="text-muted-foreground">Category</span>
                              <Select
                                value={(selectedTxn.category || '').toLowerCase() || 'other'}
                                disabled
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value={(selectedTxn.category || 'other') || 'other'}>
                                    {(selectedTxn.category || 'Other').charAt(0).toUpperCase() +
                                      (selectedTxn.category || 'other').slice(1)}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </label>
                            <label className="text-sm flex flex-col gap-2">
                              <span className="text-muted-foreground">Memo</span>
                              <input
                                readOnly
                                value={selectedTxn.description || ''}
                                title="Memo is shown from the imported bank narration — editing requires the transaction update API."
                                className="ring-offset-background rounded-md bg-muted/50 text-sm border border-input outline-none px-3 h-10 placeholder:text-muted-foreground cursor-not-allowed"
                              />
                            </label>
                          </div>
                          <label className="text-sm flex mt-4 items-center gap-2 opacity-60">
                            <Checkbox
                              defaultChecked={false}
                              disabled
                              title="GST exclusion is a finance-policy action confirmed during invoice review."
                            />
                            <span>Exclude from GST</span>
                          </label>
                        </div>
                      </div>
                    )}
                    {!selectedTxn && (
                      <div className="p-10 text-center">
                        <ReceiptText className="text-muted-foreground size-10 mx-auto" />
                        <p className="font-medium mt-4">Select a transaction to review</p>
                        <p className="text-muted-foreground text-sm mt-1">
                          Choose a needs-review transaction on the left to see its suggested invoice match.
                        </p>
                      </div>
                    )}
                  </Card>
                </div>
              )}
              <div className="rounded-md bg-muted text-muted-foreground text-sm border border-border flex mt-6 px-4 py-3 items-center gap-3">
                <AlertCircle className="size-4" />
                <span>
                  {ctxError || dataError
                    ? 'Reconciliation data is unavailable — figures are never shown from a demo source.'
                    : `${unmatched.length} transaction${unmatched.length === 1 ? '' : 's'} on this business still need reconciliation`}
                </span>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

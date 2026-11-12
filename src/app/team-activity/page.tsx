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
  SearchX,
  Settings,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';

interface AuditEventShape {
  id: string;
  shop_id: string;
  actor_id: string;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata?: Record<string, unknown> | null;
  reason?: string | null;
  created_at: string;
}

/** Human verb per logged action. Unmapped actions fall back to the raw token. */
const ACTION_VERBS: Record<string, string> = {
  shop_created: 'created the business record',
  shop_updated: 'updated the business record',
  invoice_created: 'recorded an invoice',
  invoice_updated: 'updated an invoice',
  invoice_confirmed: 'confirmed an invoice',
  transaction_imported: 'imported bank transactions',
  transactions_imported: 'imported bank transactions',
  import_batch_created: 'imported a bank statement batch',
  reconciliation_matched: 'matched a payment to an invoice',
  reconciliation_confirmed: 'confirmed a reconciliation match',
  reconciliation_rejected: 'rejected a suggested match',
  gst_summary_generated: 'generated a GST period summary',
  document_uploaded: 'uploaded a document',
  document_processed: 'processed a document',
  member_invited: 'invited a member to the workspace',
  review_issue_resolved: 'resolved a review issue',
};

const ENTITY_BADGES: Record<string, string> = {
  shop: 'Workspace',
  shop_member: 'Team',
  invoice: 'Invoices',
  transaction: 'Transactions',
  import_batch: 'Transactions',
  transaction_batch: 'Transactions',
  reconciliation_match: 'Reconciliation',
  gst_summary: 'GST & Tax',
  filing_period: 'GST & Tax',
  document: 'Documents',
};

function verbOf(action: string): string {
  return ACTION_VERBS[action] || `triggered ${action.replace(/_/g, ' ')}`;
}

function badgeOf(entityType: string | null): string {
  if (!entityType) return 'System';
  return ENTITY_BADGES[entityType] || entityType.replace(/_/g, ' ');
}

/** Detail fragment from metadata — only well-typed scalar fields, never invented. */
function metaDetail(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata || typeof metadata !== 'object') return '';
  const candidates: string[] = [];
  for (const key of ['invoice_number', 'name', 'batch_name']) {
    const val = metadata[key];
    if (typeof val === 'string' && val.trim()) candidates.push(val.trim());
  }
  for (const key of ['count', 'rows', 'imported', 'total']) {
    const val = metadata[key];
    if (typeof val === 'number' && Number.isFinite(val)) candidates.push(`${val} record${val === 1 ? '' : 's'}`);
  }
  return candidates.length ? ` · ${candidates.join(', ')}` : '';
}

/**
 * CSV field sanitizer for the client-side export (formula-injection safe).
 */
function sanitizeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  if (str.length > 0 && ['=', '+', '-', '@', '\t', '\r'].includes(str[0])) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/** Stability marker for window filters — captured once at module load (not during render). */
const PAGE_LOAD_TS = Date.now();

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return `${String(d.getDate()).padStart(2, '0')} ${d.toLocaleString('en-IN', { month: 'short' })} ${d.getFullYear()}`;
}

export default function TeamActivity() {
  const router = useRouter();
  const {
    shop,
    loading: ctxLoading,
    error: ctxError,
    needsOnboarding,
    userEmail,
    userId,
    refresh,
  } = useShopContext();

  const [events, setEvents] = useState<AuditEventShape[] | null>(null);
  const [total, setTotal] = useState(0);
  const [dataError, setDataError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [actorFilter, setActorFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('30'); // days

  useEffect(() => {
    let cancelled = false;
    async function load() {
      await Promise.resolve();
      if (cancelled) return;
    setEvents(null);
    setDataError(null);
      try {
        const res = await fetch('/api/audit-events?limit=50', { cache: 'no-store' });
        if (cancelled) return;
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          setDataError(data?.error || `Could not load the activity log (HTTP ${res.status}).`);
          setEvents([]);
          return;
        }
        if (Array.isArray(data.events)) {
          setEvents(data.events);
          setTotal(typeof data.total === 'number' ? data.total : data.events.length);
        } else {
          setEvents([]);
          setTotal(0);
        }
      } catch {
        if (!cancelled) {
          setDataError('Network error while loading the activity log.');
          setEvents([]);
        }
      }
    }
    if (!ctxLoading) load();
    return () => {
      cancelled = true;
    };
  }, [ctxLoading, shop?.id]);

  // Distinct actors seen in this business's log — filters are derived, never preset.
  const actorOptions = useMemo(() => {
    const ids = Array.from(new Set((events || []).map((e) => e.actor_id)));
    let unnamed = 0;
    return ids.map((id) => {
      const isYou = userId && id === userId;
      if (isYou) return { id, label: 'You' };
      unnamed += 1;
      return { id, label: `Member ${unnamed + 1}` };
    });
  }, [events, userId]);

  const actionOptions = useMemo(() => {
    const actions = Array.from(new Set((events || []).map((e) => e.action))).sort();
    return actions;
  }, [events]);

  const rows = useMemo(() => {
    let list = events || [];
    if (actorFilter !== 'all') list = list.filter((e) => e.actor_id === actorFilter);
    if (actionFilter !== 'all') list = list.filter((e) => e.action === actionFilter);
    if (periodFilter !== 'all') {
      const cutoff = new Date(PAGE_LOAD_TS - parseInt(periodFilter, 10) * 86400000);
      list = list.filter((e) => new Date(e.created_at) >= cutoff);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) =>
        `${verbOf(e.action)} ${badgeOf(e.entity_type)} ${e.reason || ''}`
          .toLowerCase()
          .includes(q)
      );
    }
    return list;
  }, [events, actorFilter, actionFilter, periodFilter, search]);

  function exportCsv() {
    if (!rows) return;
    const lines = ['Timestamp,Actor,Action,Entity type,Entity reference,Reason'];
    for (const e of rows) {
      lines.push(
        [
          sanitizeCsvField(e.created_at),
          sanitizeCsvField(userId && e.actor_id === userId ? userEmail || 'You' : 'Member'),
          sanitizeCsvField(e.action),
          sanitizeCsvField(e.entity_type || 'system'),
          sanitizeCsvField(e.entity_id || ''),
          sanitizeCsvField(e.reason || ''),
        ].join(',')
      );
    }
    const blob = new Blob([lines.join('\r\n')], { type: 'text/csv; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team-activity-log.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
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
                className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
                <span className="font-medium text-foreground">
                  Team activity
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
              <div className="flex mb-8 justify-between items-start">
                <div>
                  <h1 className="font-semibold text-2xl tracking-tight">
                    Team activity
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    A transparent log of changes across your workspace.
                  </p>
                </div>
                <Button
                  className="gap-2"
                  onClick={exportCsv}
                  disabled={!events || events.length === 0}
                  title="Downloads the filtered activity log as a CSV"
                >
                  <Download className="size-4" />
                  Export log
                </Button>
              </div>
              <div className="flex mb-6 items-center gap-3">
                <label className="rounded-md bg-card border border-input flex px-3 items-center gap-2 w-64 h-10">
                  <Search className="text-muted-foreground size-4" />
                  <input
                    type="search"
                    placeholder="Search activity"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                  />
                </label>
                <Select value={actorFilter} onValueChange={setActorFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All actors" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actors</SelectItem>
                    {actorOptions.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {actionOptions.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a.replace(/_/g, ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">Last 30 days</SelectItem>
                    <SelectItem value="7">Last 7 days</SelectItem>
                    <SelectItem value="90">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {ctxError || dataError ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <p className="font-medium">
                      {ctxError ? 'Could not load your business context.' : dataError}
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      The activity log shows this business&apos;s own audit trail only.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => refresh()}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : ctxLoading || events === null ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <p className="font-medium text-muted-foreground">
                      Loading the activity log…
                    </p>
                  </CardContent>
                </Card>
              ) : needsOnboarding ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <Building2 className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">No business yet</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Complete onboarding to start your business&apos;s audit trail.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                      Set up business
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid items-start gap-6 grid-cols-[minmax(0,1fr)_320px]">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent activity</CardTitle>
                      <CardDescription>
                        {rows.length} of {Math.min(total, 50)} logged events
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="border-x border-t border-b">
                        <div>
                          {rows.length === 0 ? (
                            <div className="text-center px-6 py-16 flex-col justify-center items-center">
                              <SearchX className="text-muted-foreground mb-3 size-8" />
                              <p className="font-medium text-sm">No activity found</p>
                              <p className="text-muted-foreground text-sm mt-1">
                                Actions on this business&apos;s finances appear here as they are
                                logged.
                              </p>
                            </div>
                          ) : (
                            rows.map((e) => {
                              const isYou = userId && e.actor_id === userId;
                              const actorBadgeText = isYou
                                ? 'You'
                                : `Member ${actorOptions.findIndex((a) => a.id === e.actor_id) + 2}`;
                              return (
                                <div
                                  key={e.id}
                                  className="border-t border-r border-b border-b-border border-l-border flex px-6 py-4 items-center gap-4"
                                >
                                  <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center shrink-0 size-9">
                                    {isYou ? identityInitials(userEmail) : 'M'}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm">
                                      <span
                                        className="font-medium"
                                        title={isYou ? userEmail || undefined : 'Member identity is not exposed to other clients'}
                                      >
                                        {actorBadgeText}
                                      </span>{' '}
                                      {verbOf(e.action)}
                                      {metaDetail(e.metadata)}
                                    </p>
                                    <p className="text-muted-foreground text-xs mt-1">
                                      {fmtDate(e.created_at)}
                                    </p>
                                  </div>
                                  <Badge variant="secondary">
                                    {badgeOf(e.entity_type)}
                                  </Badge>
                                  <button
                                    aria-label={`More actions for ${isYou ? 'You' : 'this member'}`}
                                    className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                                    title={`audit action: ${e.action}`}
                                  >
                                    <MoreHorizontal className="size-4" />
                                  </button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Workspace members</CardTitle>
                      <CardDescription>
                        {actorOptions.length} actor{actorOptions.length === 1 ? '' : 's'} in the
                        logged window
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col gap-5">
                        <div className="flex items-center gap-3">
                          <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center size-9">
                            {identityInitials(userEmail)}
                          </span>
                          <span className="min-w-0">
                            <span className="font-medium text-sm block truncate">
                              {userEmail || 'Signed in'}
                            </span>
                            <span className="text-muted-foreground text-xs block">You</span>
                          </span>
                        </div>
                        {actorOptions
                          .filter((a) => !(userId && a.id === userId))
                          .map((a) => (
                            <div
                              key={a.id}
                              className="flex items-center gap-3"
                              title="Member identities are private — only actions are recorded in the log."
                            >
                              <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center size-9">
                                M
                              </span>
                              <span>
                                <span className="font-medium text-sm block">{a.label}</span>
                                <span className="text-muted-foreground text-xs block">
                                  Seen in the audit log
                                </span>
                              </span>
                            </div>
                          ))}
                      </div>
                      <Button
                        variant="outline"
                        className="mt-6 w-full"
                        disabled
                        title="Member management is not available in this release — workspace access stays controlled by shop membership records server-side."
                      >
                        Manage members
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}
              <p className="text-muted-foreground text-xs mt-6">
                Activity is retained for 12 months · Live data · this business&apos;s audit trail only
              </p>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

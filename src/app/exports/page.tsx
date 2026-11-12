'use client';

import React, { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import {
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface ExportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'default' | 'coming-soon';
  onClick?: () => void;
  period?: string;
  busy?: boolean;
}

function ExportCard({ title, description, icon, variant, onClick, period, busy }: ExportCardProps) {
  const interactive = variant === 'default' && !busy;
  return (
    <div
      className={`group rounded-2xl border border-border bg-surface p-6 shadow-sm hover:border-primary-200 dark:hover:border-primary-800/50 transition-colors ${interactive ? 'cursor-pointer' : ''} ${variant === 'coming-soon' ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={interactive ? onClick : undefined}
      aria-disabled={variant === 'coming-soon' || busy}
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.();
            }
          : undefined
      }
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-surface-tertiary flex items-center justify-center text-text-primary group-hover:bg-primary-600 group-hover:text-white transition-colors">
          {icon}
        </div>
        {period && <Badge variant="outline" size="sm">{period}</Badge>}
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">{title}</h3>
      <p className="text-sm text-text-secondary mb-4">{description}</p>
      {variant === 'default' && (
        <div className="flex items-center gap-1 text-sm font-medium text-primary-600 dark:text-primary-400">
          {busy ? (
            <>
              <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Preparing export…
            </>
          ) : (
            <>
              Export <ChevronRight className="h-3.5 w-3.5" />
            </>
          )}
        </div>
      )}
      {variant === 'coming-soon' && (
        <Badge variant="default" size="sm">In Development</Badge>
      )}
    </div>
  );
}

export default function ExportsPage() {
  const { showToast } = useToast();

  // Exports are generated for the current GST period from the server's own
  // engine — the period is resolved client-side (no prerender-time Date).
  const [period, setPeriod] = useState<{ y: number; m: number } | null>(null);
  const [busyType, setBusyType] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.resolve();
      if (!active) return;
      const n = new Date();
      setPeriod({ y: n.getFullYear(), m: n.getMonth() + 1 });
    })();
    return () => {
      active = false;
    };
  }, []);

  const periodYear = period?.y ?? 0;
  const periodMonth = period?.m ?? 0;

  async function downloadExport(type: 'gstr3b_csv' | 'gstr1_json') {
    if (!period) return;
    setBusyType(type);
    try {
      const res = await fetch(`/api/exports?type=${type}&year=${periodYear}&month=${periodMonth}`);
      if (!res.ok) {
        showToast({
          type: 'error',
          title: 'Export failed',
          description:
            res.status === 401
              ? 'Please sign in to export records.'
              : res.status === 404
                ? 'No active business found — complete onboarding first.'
                : `The server could not generate the export (HTTP ${res.status}).`,
        });
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] || `${type}.${type.endsWith('json') ? 'json' : 'csv'}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast({
        type: 'success',
        title: 'Export ready',
        description: 'Downloaded for CA review — DIGITAX does not file returns to the GST portal.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Export failed',
        description: 'Network error while generating the export. Please try again.',
      });
    } finally {
      setBusyType(null);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Exports & Reports"
          description="Export your financial data for CA review and GST filing preparation."
          breadcrumbs={[{ label: 'Dashboard' }, { label: 'Exports' }]}
        />

        <div className="rounded-2xl border border-primary-200 dark:border-primary-800/50 bg-primary-50/60 dark:bg-primary-950/20 p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 text-primary-600 dark:text-primary-400 shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-text-primary">Export for Review, Not Filing</h3>
              <p className="text-xs text-text-secondary mt-1">
                DIGITAX prepares summaries for <strong>human CA practitioner review</strong>. Exports cover your GST summaries for{' '}
                {period ? `${periodMonth}/${periodYear}` : 'the current GST period'}. DIGITAX does not file returns directly to the GST portal.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ExportCard
            title="GSTR-3B Summary"
            description="Monthly GST liability summary with output tax, ITC, and net tax payable."
            icon={<FileSpreadsheet className="h-5 w-5" />}
            variant="default"
            period={period ? `GSTR-3B ${periodMonth}/${periodYear}` : 'Current period'}
            busy={busyType === 'gstr3b_csv'}
            onClick={() => downloadExport('gstr3b_csv')}
          />
          <ExportCard
            title="GSTR-1 JSON"
            description="Outward supplies details in GSTN-compatible JSON format."
            icon={<FileText className="h-5 w-5" />}
            variant="default"
            period={period ? `GSTR-1 ${periodMonth}/${periodYear}` : 'Current period'}
            busy={busyType === 'gstr1_json'}
            onClick={() => downloadExport('gstr1_json')}
          />
          <ExportCard
            title="Sales Register"
            description="Complete register of all sales invoices with GST breakdown."
            icon={<FileText className="h-5 w-5" />}
            variant="coming-soon"
            period="Register"
          />
          <ExportCard
            title="Purchase Register"
            description="Complete register of all purchase invoices with ITC details."
            icon={<FileText className="h-5 w-5" />}
            variant="coming-soon"
            period="Register"
          />
          <ExportCard
            title="Transaction Register"
            description="All bank and UPI transactions with reconciliation status."
            icon={<FileText className="h-5 w-5" />}
            variant="coming-soon"
            period="Register"
          />
          <ExportCard
            title="CA Audit Package"
            description="Complete audit-ready package with sales, purchase, GST, and reconciliation reports."
            icon={<Download className="h-5 w-5" />}
            variant="coming-soon"
          />
        </div>
      </div>
    </AppShell>
  );
}

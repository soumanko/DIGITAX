'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from '@/lib/theme-provider';
import {
  Download,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  File,
  CreditCard,
  Banknote,
  RefreshCw,
} from 'lucide-react';

interface ExportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'default' | 'coming-soon';
  onClick?: () => void;
  period?: string;
}

function ExportCard({ title, description, icon, variant, onClick, period }: ExportCardProps) {
  return (
    <div
      className={`group rounded-2xl border border-border bg-surface p-6 shadow-sm hover:border-primary-200 dark:hover:border-primary-800/50 transition-colors cursor-pointer ${variant === 'coming-soon' ? 'opacity-70 pointer-events-none' : ''}`}
      onClick={onClick}
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
          Export <ChevronRight className="h-3.5 w-3.5" />
        </div>
      )}
      {variant === 'coming-soon' && (
        <Badge variant="default" size="sm">In Development</Badge>
      )}
    </div>
  );
}

export default function ExportsPage() {
  const { resolvedTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  [resolvedTheme];

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
                DIGITAX prepares summaries for <strong>human CA practitioner review</strong>. Exports are for bookkeeping purposes only — DIGITAX does not file returns directly to the GST portal.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <Skeleton variant="rect" width="full" height="4" className="mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} variant="rect" height="200" className="w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <ExportCard
              title="GSTR-3B Summary"
              description="Monthly GST liability summary with output tax, ITC, and net tax payable."
              icon={<FileSpreadsheet className="h-5 w-5" />}
              variant="default"
              period="GSTR-3B"
              onClick={() => {
                window.location.href = '/api/exports?type=gstr3b_csv&year=2026&month=10';
              }}
            />
            <ExportCard
              title="GSTR-1 JSON"
              description="Outward supplies details in GSTN-compatible JSON format."
              icon={<FileText className="h-5 w-5" />}
              variant="default"
              period="GSTR-1"
              onClick={() => {
                window.location.href = '/api/exports?type=gstr1_json&year=2026&month=10';
              }}
            />
            <ExportCard
              title="Sales Register"
              description="Complete register of all sales invoices with GST breakdown."
              icon={<FileText className="h-5 w-5" />}
              variant="default"
              period="Register"
            />
            <ExportCard
              title="Purchase Register"
              description="Complete register of all purchase invoices with ITC details."
              icon={<FileText className="h-5 w-5" />}
              variant="default"
              period="Register"
            />
            <ExportCard
              title="Transaction Register"
              description="All bank and UPI transactions with reconciliation status."
              icon={<FileText className="h-5 w-5" />}
              variant="default"
              period="Register"
            />
            <ExportCard
              title="CA Audit Package"
              description="Complete audit-ready package with sales, purchase, GST, and reconciliation reports."
              icon={<ShieldCheck className="h-5 w-5" />}
              variant="coming-soon"
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

function formatINR(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
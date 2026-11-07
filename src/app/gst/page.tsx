'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/lib/theme-provider';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { Shop, Invoice } from '@/types';
import { formatINR, money } from '@/lib/decimal';
import { generateGSTPeriodSummary } from '@/lib/gst/calculator';
import {
  Calculator,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileCheck,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface PeriodSelectorProps {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}

function PeriodSelector({ year, month, onChange }: PeriodSelectorProps) {
  const months = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Feb' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Apr' }, { value: 5, label: 'May' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Aug' }, { value: 9, label: 'Sep' },
    { value: 10, label: 'Oct' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dec' },
  ];

  return (
    <div className="flex items-center gap-4">
      <label className="text-xs font-semibold text-text-tertiary uppercase">Period</label>
      <select
        value={year}
        onChange={(e) => onChange(parseInt(e.target.value), month)}
        className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {[2024, 2025, 2026, 2027].map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select
        value={month}
        onChange={(e) => onChange(year, parseInt(e.target.value))}
        className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {months.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}

interface GSTSummaryData {
  gstr1: {
    b2b: { invoiceCount: number; taxableValue: string; totalTax: string };
    b2c_small: { taxableValue: string; totalTax: string };
  };
  gstr3b: {
    outward_supplies: { taxableValue: string; igst: string; cgst: string; sgst: string };
    eligible_itc: { all_other_itc: { igst: string; cgst: string; sgst: string } };
  };
  netTaxPayable: { cgst: string; sgst: string; igst: string; total: string };
}

function GSTR3BSummary({ summary }: { summary: GSTSummaryData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="p-5 rounded-xl border border-border bg-surface-secondary">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Outward Supplies (GSTR-3B Table 3.1)</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">Taxable Value</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr3b.outward_supplies.taxableValue)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">IGST</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr3b.outward_supplies.igst)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">CGST</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr3b.outward_supplies.cgst)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">SGST</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr3b.outward_supplies.sgst)}</span>
            </div>
          </div>
        </div>
        <div className="p-5 rounded-xl border border-border bg-surface-secondary">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Input Tax Credit (Table 4)</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">IGST</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr3b.eligible_itc.all_other_itc.igst)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">CGST</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr3b.eligible_itc.all_other_itc.cgst)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">SGST</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr3b.eligible_itc.all_other_itc.sgst)}</span>
            </div>
          </div>
        </div>
      </div>
      <div className="border-l border-border pl-6">
        <div className="p-5 rounded-xl border border-border bg-surface-secondary">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Net Tax Payable</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">CGST</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.netTaxPayable.cgst)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">SGST</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.netTaxPayable.sgst)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-secondary">IGST</span>
              <span className="text-sm font-mono text-text-primary">{formatINR(summary.netTaxPayable.igst)}</span>
            </div>
            <div className="pt-3 border-t border-border flex justify-between items-center">
              <span className="text-sm font-semibold text-text-primary">Total</span>
              <span className="text-sm font-bold font-mono text-text-primary">{formatINR(summary.netTaxPayable.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function GSTR1Summary({ summary }: { summary: GSTSummaryData }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="p-5 rounded-xl border border-border bg-surface-secondary">
        <h4 className="text-sm font-semibold text-text-primary mb-3">B2B Outward Supplies</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Invoice Count</span>
            <span className="text-sm font-mono text-text-primary">{summary.gstr1.b2b.invoiceCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Taxable Value</span>
            <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr1.b2b.taxableValue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Total Tax</span>
            <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr1.b2b.totalTax)}</span>
          </div>
        </div>
      </div>
      <div className="p-5 rounded-xl border border-border bg-surface-secondary">
        <h4 className="text-sm font-semibold text-text-primary mb-3">B2C Small Supplies</h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Taxable Value</span>
            <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr1.b2c_small.taxableValue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-text-secondary">Total Tax</span>
            <span className="text-sm font-mono text-text-primary">{formatINR(summary.gstr1.b2c_small.totalTax)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GSTWorkspacePage() {
  const { resolvedTheme } = useTheme();
  const [shop, setShop] = useState<Shop | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState({ year: 2026, month: 10 });
  const [activeTab, setActiveTab] = useState<'gstr3b' | 'gstr1'>('gstr3b');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  [resolvedTheme];

  async function loadData() {
    setLoading(true);
    try {
      const [shopRes, invRes] = await Promise.all([
        fetch('/api/shops'),
        fetch('/api/invoices'),
      ]);
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        if (shopData.shop) setShop(shopData.shop);
      }
      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData.invoices)) setInvoices(invData.invoices);
      }
    } catch {
      // Error handled by empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 0);
    return () => clearTimeout(timer);
  }, []);

  const summary = generateGSTPeriodSummary(
    shop?.id || 'unknown',
    selectedPeriod.year,
    selectedPeriod.month,
    invoices
  );

  const buttonContent = isSaving ? (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ) : (
    <>
      <Download className="h-4 w-4 mr-2" /> Save Summary
    </>
  );

  async function handleSaveSnapshot() {
    setIsSaving(true);
    try {
      const res = await fetch('/api/gst/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: selectedPeriod.year,
          month: selectedPeriod.month,
          summary,
        }),
      });
    } catch {
      // Error handled silently
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="GST Workspace"
          description="Prepare and review your GST returns for filing. All calculations are for practitioner review."
          breadcrumbs={[{ label: 'Dashboard' }, { label: 'GST' }]}
          action={
            <Button variant="primary" disabled={isSaving} onClick={handleSaveSnapshot}>
              {buttonContent}
            </Button>
          }
        />

        <div className="flex items-center gap-3">
          <PeriodSelector
            year={selectedPeriod.year}
            month={selectedPeriod.month}
            onChange={(y, m) => setSelectedPeriod({ year: y, month: m })}
          />
          <div className="ml-auto flex items-center gap-2">
            <Badge variant={summary.netTaxPayable.total === '0.00' ? 'success' : 'warning'} size="sm">
              {summary.netTaxPayable.total === '0.00' ? 'ITC Offset' : 'Tax Payable'}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Output Tax"
            value={summary.gstr3b.outward_supplies.cgst}
            variant="default"
            icon={<TrendingUp className="h-5 w-5" />}
          />
          <StatCard
            title="Input Tax Credit"
            value={summary.gstr3b.eligible_itc.all_other_itc.cgst}
            variant="success"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatCard
            title="Net GST Liability"
            value={summary.netTaxPayable.total}
            variant="error"
            icon={<Calculator className="h-5 w-5" />}
          />
          <StatCard
            title="Total Taxable Value"
            value={summary.gstr3b.outward_supplies.taxableValue}
            variant="default"
            icon={<FileCheck className="h-5 w-5" />}
          />
        </div>

        <div className="flex gap-1 border-b border-border pb-2">
          <button
            onClick={() => setActiveTab('gstr3b')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'gstr3b'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
            }`}
          >
            <Calculator className="h-4 w-4" />
            GSTR-3B
          </button>
          <button
            onClick={() => setActiveTab('gstr1')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border-b-2 ${
              activeTab === 'gstr1'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            GSTR-1
          </button>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {activeTab === 'gstr3b' ? (
            <div className="flex flex-col">
              <GSTR3BSummary summary={summary} />
              <div className="mt-8 border-l border-border pl-6">
                <div className="p-5 rounded-xl border border-border bg-surface-secondary">
                  <h4 className="text-sm font-semibold text-text-primary mb-3">Filing Status</h4>
                  <p className="text-sm text-text-secondary mb-4">
                    GST summaries are prepared for <strong>human practitioner review</strong>. DIGITAX does not file returns directly to the GST portal.
                  </p>
                  <Button variant="ghost" size="sm" className="w-full" onClick={() => {
                    window.location.href = '/api/exports?type=gstr3b_csv&year=2026&month=10';
                  }}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export GSTR-3B CSV
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full mt-2" onClick={() => {
                    window.location.href = '/api/exports?type=gstr1_json&year=2026&month=10';
                  }}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" /> Export GSTR-1 JSON
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <GSTR1Summary summary={summary} />
          )}
        </div>
      </div>
    </AppShell>
  );
}

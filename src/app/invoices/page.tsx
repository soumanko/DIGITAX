'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/lib/theme-provider';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { money } from '@/lib/decimal';
import { Invoice } from '@/types';
import {
  FileText,
  Search,
  Filter,
  UploadCloud,
  ChevronRight,
  Eye,
  Trash2,
} from 'lucide-react';

function InvoiceStatusBadge({ status }: { status: string }) {
  const variants: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'accent'; label: string }> = {
    paid: { variant: 'success', label: 'Paid' },
    unpaid: { variant: 'error', label: 'Unpaid' },
    partial: { variant: 'warning', label: 'Partial' },
  };
  const v = variants[status] || { variant: 'default', label: status };
  return <Badge variant={v.variant} size="sm">{v.label}</Badge>;
}

function InvoiceReviewBadge({ state }: { state: string }) {
  const variants: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'accent'; label: string }> = {
    confirmed: { variant: 'success', label: 'Confirmed' },
    pending_review: { variant: 'warning', label: 'Pending Review' },
    corrected: { variant: 'accent', label: 'Corrected' },
    rejected: { variant: 'error', label: 'Rejected' },
    needs_clarification: { variant: 'accent', label: 'Needs Clarification' },
  };
  const v = variants[state] || { variant: 'default', label: state };
  return <Badge variant={v.variant} size="sm">{v.label.replace('_', ' ')}</Badge>;
}

function InvoiceTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="outline" size="sm">
      {type === 'sales_tax_invoice' ? 'Sales Invoice' : 'Purchase Invoice'}
    </Badge>
  );
}

export default function InvoicesPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  [resolvedTheme];
  const [loading, setLoading] = useState(true);

  const statusOptions = [
    { label: 'Paid', value: 'paid' },
    { label: 'Unpaid', value: 'unpaid' },
    { label: 'Partial', value: 'partial' },
  ];

  const typeOptions = [
    { label: 'Sales', value: 'sales_tax_invoice' },
    { label: 'Purchase', value: 'purchase_tax_invoice' },
  ];

  useEffect(() => {
    loadInvoices();
  }, []);

  async function loadInvoices() {
    setLoading(true);
    try {
      const res = await fetch('/api/invoices');
      if (res.ok) {
        const data = await res.json();
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
      }
    } catch {
      // Error handled by empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadInvoices(), 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.buyer_name || inv.supplier_name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === 'all' || inv.payment_status === filterStatus;
    const matchesType =
      filterType === 'all' || inv.invoice_type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalValue = filteredInvoices.reduce(
    (acc, inv) => acc.plus(money(inv.total_amount || '0')),
    money(0)
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Invoice Management"
          description="Record, track, and manage your sales and purchase invoices."
          breadcrumbs={[{ label: 'Dashboard' }, { label: 'Invoices' }]}
          action={
            <div className="flex items-center gap-2">
              <Button variant="primary" size="sm" onClick={() => router.push('/documents')}>
                <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Upload Document
              </Button>
            </div>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">Total Invoices</p>
            <p className="text-xl font-bold text-text-primary font-mono mt-1">
              {filteredInvoices.length}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">Total Value</p>
            <p className="text-xl font-bold text-text-primary font-mono mt-1">
              {formatINR(totalValue.toString())}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">Paid</p>
            <p className="text-xl font-bold text-success-600 dark:text-success-400 font-mono mt-1">
              {filteredInvoices.filter(i => i.payment_status === 'paid').length}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">Unpaid</p>
            <p className="text-xl font-bold text-error-600 dark:text-error-400 font-mono mt-1">
              {filteredInvoices.filter(i => i.payment_status === 'unpaid').length}
            </p>
          </div>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search invoice number or party…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80"
            />
            <div className="flex gap-1">
              {statusOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterStatus(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    filterStatus === opt.value
                      ? 'bg-primary-600 border-primary-600 text-white'
                      : 'border-border bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
              <div className="flex gap-1">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setFilterType(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                      filterType === opt.value
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'border-border bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8">
                <Skeleton variant="rect" width="full" height="4" className="mb-6" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} variant="rect" height="70" className="w-full" />
                  ))}
                </div>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-10 w-10 text-text-tertiary" />}
                title="No invoices found"
                description={
                  searchTerm || filterStatus !== 'all' || filterType !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'Upload your first invoice to get started.'
                }
                action={
                  <Button variant="primary" size="sm" onClick={() => router.push('/documents')}>
                    <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Upload Document
                  </Button>
                }
              />
            ) : viewMode === 'list' ? (
              <InvoiceListView invoices={filteredInvoices} />
            ) : (
              <InvoiceGridView invoices={filteredInvoices} />
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function InvoiceListView({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-surface-secondary border-b border-border">
          <tr>
            <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Invoice #</th>
            <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Party</th>
            <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Type</th>
            <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Date</th>
            <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase text-right">Amount</th>
            <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase text-center">Status</th>
            <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase text-center">Review</th>
            <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {invoices.map((inv) => (
            <tr key={inv.id} className="hover:bg-surface-secondary transition-colors group">
              <td className="px-4 py-3.5">
                <span className="font-mono text-text-primary">
                  {escapeHtml(inv.invoice_number)}
                </span>
              </td>
              <td className="px-4 py-3.5">
                <p className="text-sm font-medium text-text-primary truncate" title={escapeHtml(inv.buyer_name || inv.supplier_name || '—')}>
                  {escapeHtml(inv.buyer_name || inv.supplier_name || '—')}
                </p>
                <p className="text-xs text-text-tertiary font-mono">
                  {escapeHtml(inv.customer_gstin || inv.supplier_gstin || 'Unregistered')}
                </p>
              </td>
              <td className="px-4 py-3.5">
                <InvoiceTypeBadge type={inv.invoice_type || 'sales_tax_invoice'} />
              </td>
              <td className="px-4 py-3.5">
                <span className="text-sm text-text-tertiary font-mono">
                  {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '—'}
                </span>
              </td>
              <td className="px-4 py-3.5 text-right">
                <span className="text-sm font-bold font-mono text-text-primary">
                  {formatINR(inv.total_amount || '0')}
                </span>
              </td>
              <td className="px-4 py-3.5 text-center">
                <InvoiceStatusBadge status={inv.payment_status || 'unpaid'} />
              </td>
              <td className="px-4 py-3.5 text-center">
                <InvoiceReviewBadge state={inv.review_state || 'confirmed'} />
              </td>
              <td className="px-4 py-3.5 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button
                    className="p-2 text-text-tertiary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-tertiary rounded-lg transition-colors"
                    aria-label="View details"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="p-2 text-text-tertiary hover:text-error-600 dark:hover:text-error-400 hover:bg-surface-tertiary rounded-lg transition-colors"
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InvoiceGridView({ invoices }: { invoices: Invoice[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {invoices.map((inv) => (
        <InvoiceCard key={inv.id} inv={inv} />
      ))}
    </div>
  );
}

function InvoiceCard({ inv }: { inv: Invoice }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm hover:shadow-md transition-all group">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg bg-surface-tertiary flex items-center justify-center text-text-tertiary">
          <FileText className="h-5 w-5" />
        </div>
        <InvoiceTypeBadge type={inv.invoice_type || 'sales_tax_invoice'} />
      </div>
      <div className="flex-1 mb-3">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-bold text-text-primary truncate" title={escapeHtml(inv.invoice_number)}>
            {escapeHtml(inv.invoice_number)}
          </h4>
          <InvoiceStatusBadge status={inv.payment_status || 'unpaid'} />
        </div>
        <p className="text-xs text-text-tertiary truncate mt-1" title={escapeHtml(inv.buyer_name || inv.supplier_name || '—')}>
          {escapeHtml(inv.buyer_name || inv.supplier_name || '—')}
        </p>
        <p className="text-xs text-text-tertiary font-mono mt-2">
          {escapeHtml(inv.customer_gstin || inv.supplier_gstin || 'Unregistered')}
        </p>
        <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
          <span className="text-xs font-medium text-text-primary">Amount</span>
          <span className="text-xs font-bold font-mono text-text-primary">
            {formatINR(inv.total_amount || '0')}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs font-medium text-text-secondary">Date</span>
          <span className="text-xs text-text-tertiary font-mono">
            {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString('en-IN') : '—'}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <InvoiceReviewBadge state={inv.review_state || 'confirmed'} />
        <button
          className="p-2 text-text-tertiary hover:text-primary-600 dark:hover:text-primary-400 hover:bg-surface-tertiary rounded-lg transition-colors"
          aria-label="View details"
        >
          <Eye className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function formatINR(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return '—';
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}
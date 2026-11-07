'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { DataTable } from '@/components/ui/data-table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useTheme } from '@/lib/theme-provider';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { formatINR } from '@/lib/decimal';
import { Transaction } from '@/types';
import {
  ArrowLeftRight,
  UploadCloud,
  Search,
  Filter,
  FileSpreadsheet,
  Plus,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

function DirectionBadge({ direction }: { direction: string }) {
  const isCredit = direction === 'credit';
  return (
    <Badge
      variant={isCredit ? 'success' : 'error'}
      size="sm"
    >
      {isCredit ? 'Credit (+)' : 'Debit (−)'}
    </Badge>
  );
}

function ReconciliationStatusBadge({ status }: { status: string }) {
  const variants: Record<string, 'default' | 'success' | 'warning' | 'error' | 'accent'> = {
    matched: 'success',
    unmatched: 'warning',
    partial: 'accent',
  };
  return (
    <Badge variant={variants[status] || 'default'} size="sm">
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </Badge>
  );
}

export default function TransactionsPage() {
  const { resolvedTheme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit' | 'unmatched'>('all');
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);

  const typeOptions = [
    { label: 'All Transactions', value: 'all' },
    { label: 'Credits', value: 'credit' },
    { label: 'Debits', value: 'debit' },
    { label: 'Unmatched', value: 'unmatched' },
  ];

  async function loadTransactions() {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        setTransactions(Array.isArray(data.transactions) ? data.transactions : []);
      }
    } catch {
      // Error handled by empty state
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadTransactions(), 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredTxns = transactions.filter((t) => {
    const matchesSearch =
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'credit') return matchesSearch && t.direction === 'credit';
    if (filterType === 'debit') return matchesSearch && t.direction === 'debit';
    if (filterType === 'unmatched') return matchesSearch && t.reconciliation_status === 'unmatched';
    return matchesSearch;
  });

  const totalCredits = filteredTxns
    .filter((t) => t.direction === 'credit')
    .reduce((acc, t) => acc + parseFloat(t.amount || '0'), 0);
  const totalDebits = filteredTxns
    .filter((t) => t.direction === 'debit')
    .reduce((acc, t) => acc + parseFloat(t.amount || '0'), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Bank Transactions"
          description="View, import, and reconcile your bank and UPI transactions."
          breadcrumbs={[{ label: 'Dashboard' }, { label: 'Transactions' }]}
          action={
            <Button variant="primary" onClick={() => setShowImportModal(true)}>
              <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Import Statement
            </Button>
          }
        />

        {/* Summary Strip */ }
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">Total Credits</p>
            <p className="text-xl font-bold text-text-primary font-mono mt-1">+{formatINR(String(totalCredits))}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">Total Debits</p>
            <p className="text-xl font-bold text-text-primary font-mono mt-1">−{formatINR(String(totalDebits))}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">Net Flow</p>
            <p className={`text-xl font-bold font-mono mt-1 ${totalCredits >= totalDebits ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
              {totalCredits >= totalDebits ? '+' : '−'}{formatINR(String(Math.abs(totalCredits - totalDebits)))}
            </p>
          </div>
        </div>

        {/* Filters */ }
        <div className="bg-surface border border-border rounded-2xl p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              placeholder="Search description or reference…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-80"
            />
            <div className="flex gap-1">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilterType(opt.value as 'all' | 'credit' | 'debit' | 'unmatched')}
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

        {/* Transactions List */ }
        <div className="rounded-2xl border border-border bg-surface shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8">
              <Skeleton variant="rect" width="full" height="4" className="mb-6" />
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} variant="rect" height="60" className="w-full" />
                ))}
              </div>
            </div>
          ) : filteredTxns.length === 0 ? (
            <EmptyState
              icon={<ArrowLeftRight className="h-10 w-10 text-text-tertiary" />}
              title="No transactions found"
              description={
                searchTerm || filterType !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Import your bank statement to begin tracking transactions.'
              }
              action={
                <Button variant="primary" size="sm" onClick={() => setShowImportModal(true)}>
                  <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Import Statement
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-secondary border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Date</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Description</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Reference</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase">Direction</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase text-right">Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-text-tertiary uppercase text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTxns.map((tx) => (
                    <tr key={tx.id} className="hover:bg-surface-secondary transition-colors group">
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-text-primary">
                          {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString('en-IN') : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm font-medium text-text-primary truncate" title={escapeHtml(tx.description || '')}>
                          {escapeHtml(tx.description || 'Untitled')}
                        </p>
                        {tx.category && (
                          <p className="text-xs text-text-tertiary">{escapeHtml(tx.category.replace('_', ' '))}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-text-tertiary font-mono">
                          {escapeHtml(tx.reference_number || '—')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <DirectionBadge direction={tx.direction} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <span className={`text-sm font-bold font-mono ${tx.direction === 'credit' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'}`}>
                          {tx.direction === 'credit' ? '+' : '−'}{formatINR(tx.amount || '0')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <ReconciliationStatusBadge status={tx.reconciliation_status || 'unmatched'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Import Modal */ }
        <div className="fixed inset-0 z-50 hidden" aria-hidden={!showImportModal}>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowImportModal(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-surface border border-border rounded-3xl shadow-2xl w-full max-w-2xl p-6 animate-scale-in">
              <div className="flex items-start justify-between mb-6">
                <h3 className="text-lg font-bold text-text-primary">Import Bank Statement</h3>
                <button onClick={() => setShowImportModal(false)} className="p-2 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary">
                  <span className="sr-only">Close</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-text-secondary mb-6">
                Upload a CSV bank statement to import transactions. Supported formats: HDFC, ICICI, SBI, UPI.
              </p>
              <input
                type="file"
                accept=".csv"
                className="block w-full text-sm text-text-tertiary file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-600 file:text-white hover:file:bg-primary-700 mb-4"
              />
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setShowImportModal(false)}>Cancel</Button>
                <Button variant="primary">Import Transactions</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

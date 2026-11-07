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
import { useTheme } from '@/lib/theme-provider';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { formatINR } from '@/lib/decimal';
import { Invoice, Transaction } from '@/types';
import {
  Link2,
  CheckCircle2,
  ArrowRight,
  X,
  AlertCircle,
  HelpCircle,
  FileText,
  CreditCard,
  Layers,
  History,
  ChevronRight,
  Clock,
} from 'lucide-react';

function MatchCard({
  invoice,
  transaction,
  confidence,
  onApprove,
  onReject,
  isProcessing,
}: {
  invoice: Invoice;
  transaction: Transaction;
  confidence: number | null;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-text-primary">{escapeHtml(invoice.invoice_number)}</h3>
            <Badge variant="outline" size="sm">
              {invoice.invoice_type === 'sales_tax_invoice' ? 'Sales' : 'Purchase'}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-text-primary">
              {escapeHtml(invoice.buyer_name || invoice.supplier_name || invoice.customer_trade_name || '—')}
            </p>
            <p className="text-text-tertiary">
              {invoice.invoice_date || '—'} • {formatINR(invoice.total_amount)}
            </p>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-text-primary">
              {escapeHtml(transaction.description || 'Bank Transaction')}
            </h3>
            <Badge variant={transaction.direction === 'credit' ? 'success' : 'error'} size="sm">
              {transaction.direction === 'credit' ? 'Credit' : 'Debit'}
            </Badge>
          </div>
          <div className="space-y-1 text-sm">
            <p className="text-text-primary">
              {transaction.transaction_date || '—'} • {escapeHtml(transaction.reference_number || '—')}
            </p>
            <p className="text-text-tertiary">
              {transaction.direction === 'credit' ? '+' : '−'}{formatINR(transaction.amount)}
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-end">
          <div className="text-right">
            <p className="text-sm font-bold text-text-primary">
              {confidence !== null ? `${Math.round(confidence * 100)}%` : '—'} match
            </p>
            <p className="text-xs text-text-tertiary">Confidence</p>
          </div>
          <div className="flex gap-2 mt-2 md:mt-0">
            <button
              onClick={onApprove}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-success-600 text-white text-sm font-medium hover:bg-success-700 disabled:opacity-60 transition-colors flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Confirm
            </button>
            <button
              onClick={onReject}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-lg bg-error-600 text-white text-sm font-medium hover:bg-error-700 disabled:opacity-60 transition-colors flex items-center gap-1.5"
            >
              <X className="h-3.5 w-3.5" /> Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReconciliationPage() {
  const { resolvedTheme } = useTheme();
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [confirmedMatches, setConfirmedMatches] = useState<string[]>([]);
  const [rejectedMatches, setRejectedMatches] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  [resolvedTheme];

  async function loadData() {
    setLoading(true);
    try {
      const [invRes, txnRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/transactions'),
      ]);
      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.invoices || []);
      }
      if (txnRes.ok) {
        const txnData = await txnRes.json();
        setTransactions(txnData.transactions || []);
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

  async function handleApprove(
    invoiceId: string,
    transactionId: string,
    allocatedAmount: string
  ) {
    const matchKey = `${invoiceId}-${transactionId}`;
    setIsProcessing(matchKey);
    try {
      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          invoice_id: invoiceId,
          allocated_amount: allocatedAmount,
        }),
      });
      if (res.ok) {
        setConfirmedMatches((prev) => [...prev, matchKey]);
        loadData();
      }
    } catch {
      // Error handled silently
    } finally {
      setIsProcessing(null);
    }
  }

  async function handleReject(invoiceId: string, transactionId: string) {
    const matchKey = `${invoiceId}-${transactionId}`;
    setRejectedMatches((prev) => [...prev, matchKey]);
  }

  const matchCandidates: Array<{
    invoice: Invoice;
    transaction: Transaction;
    confidence_score: number | null;
  }> = [];

  const matchedCount = confirmedMatches.length;
  const unmatchedCount = transactions.filter(
    (t) => t.reconciliation_status !== 'matched'
  ).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          title="Bank Reconciliation"
          description="Match your bank transactions with invoices to keep your books accurate."
          breadcrumbs={[{ label: 'Dashboard' }, { label: 'Reconciliation' }]}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">
              Matched
            </p>
            <p className="text-xl font-bold text-success-600 dark:text-success-400 font-mono mt-1">
              {matchedCount}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              transactions reconciled
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">
              Unmatched
            </p>
            <p className="text-xl font-bold text-warning-600 dark:text-warning-400 font-mono mt-1">
              {unmatchedCount}
            </p>
            <p className="text-xs text-text-secondary mt-1">
              awaiting reconciliation
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <p className="text-xs font-semibold text-text-tertiary uppercase">
              Match Rate
            </p>
            <p className="text-xl font-bold text-text-primary font-mono mt-1">
              {transactions.length > 0
                ? Math.round((matchedCount / transactions.length) * 100)
                : 0}%
            </p>
            <p className="text-xs text-text-secondary mt-1">
              of transactions matched
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <Skeleton variant="rect" width="full" height="4" className="mb-6" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} variant="rect" height="140" className="w-full" />
              ))}
            </div>
          </div>
        ) : matchCandidates.length === 0 && unmatchedCount > 0 ? (
          <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-warning-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-text-primary mb-2">
                No match suggestions
              </h3>
              <p className="text-text-secondary max-w-md mx-auto mb-6">
                No automated match suggestions found for your unmatched transactions.
                You can manually match transactions or import more invoices.
              </p>
              <div className="flex justify-center">
                <Button
                  variant="primary"
                  onClick={() => router.push('/documents')}
                >
                  Upload Invoices
                </Button>
              </div>
            </div>
          </div>
        ) : matchCandidates.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 className="h-10 w-10 text-success-500" />}
            title="All transactions reconciled"
            description="Your books are up to date. No pending reconciliation items."
          />
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-text-primary">
              Match Suggestions
            </h3>
            <div className="space-y-3">
              {matchCandidates.map((candidate) => (
                <MatchCard
                  key={`${candidate.invoice.id}-${candidate.transaction.id}`}
                  invoice={candidate.invoice}
                  transaction={candidate.transaction}
                  confidence={candidate.confidence_score}
                  onApprove={() =>
                    handleApprove(
                      candidate.invoice.id,
                      candidate.transaction.id,
                      candidate.transaction.amount
                    )
                  }
                  onReject={() =>
                    handleReject(
                      candidate.invoice.id,
                      candidate.transaction.id
                    )
                  }
                  isProcessing={
                    isProcessing ===
                    `${candidate.invoice.id}-${candidate.transaction.id}`
                  }
                />
              ))}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-text-primary">
              Reconciliation History
            </h3>
            <Link href="/reconciliation/history" className="text-sm font-medium text-primary-600 hover:text-primary-500 dark:hover:text-primary-400">
              View all <ChevronRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
          <div className="h-64 overflow-y-auto border border-border rounded-xl p-3 bg-surface-secondary">
            <p className="text-xs text-text-tertiary text-center mt-10">
              Reconciliation history will appear here once matches are confirmed.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

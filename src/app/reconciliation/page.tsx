'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DEMO_INVOICES, DEMO_TRANSACTIONS } from '@/lib/demo-data';
import { findMatchSuggestions, MatchCandidate } from '@/lib/reconciliation/engine';
import { formatINR } from '@/lib/decimal';
import {
  Link2,
  CheckCircle2,
  Sparkles,
  Check,
  X,
  RotateCcw,
  AlertCircle,
  FileText,
  CreditCard,
  History,
  Search,
} from 'lucide-react';

export default function ReconciliationPage() {
  const [invoices, setInvoices] = useState(DEMO_INVOICES);
  const [transactions, setTransactions] = useState(DEMO_TRANSACTIONS);
  const [persistedMatches, setPersistedMatches] = useState<any[]>([]);
  const [confirmedMatchKeys, setConfirmedMatchKeys] = useState<string[]>([]);
  const [dismissedMatches, setDismissedMatches] = useState<string[]>([]);
  const [isSubmittingMatch, setIsSubmittingMatch] = useState<string | null>(null);
  const [isReversing, setIsReversing] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [partialAmounts, setPartialAmounts] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const fetchReconData = async () => {
    try {
      const [reconRes, invRes, txnRes] = await Promise.all([
        fetch('/api/reconciliation'),
        fetch('/api/invoices'),
        fetch('/api/transactions'),
      ]);

      if (invRes.ok) {
        const invData = await invRes.json();
        if (Array.isArray(invData.invoices) && invData.invoices.length > 0) {
          setInvoices(invData.invoices);
        }
      }

      if (txnRes.ok) {
        const txnData = await txnRes.json();
        if (Array.isArray(txnData.transactions) && txnData.transactions.length > 0) {
          setTransactions(txnData.transactions);
        }
      }

      if (reconRes.ok) {
        const reconData = await reconRes.json();
        if (Array.isArray(reconData.matches)) {
          setPersistedMatches(reconData.matches);
        }
      }
    } catch (e) {
      console.warn('Could not load remote reconciliation data:', e);
    }
  };

  useEffect(() => {
    fetchReconData();
  }, []);

  // Compute live match suggestions using deterministic reconciliation engine
  const matchCandidates = findMatchSuggestions(invoices, transactions).filter(
    (c) =>
      !confirmedMatchKeys.includes(`${c.invoice.id}-${c.transaction.id}`) &&
      !dismissedMatches.includes(`${c.invoice.id}-${c.transaction.id}`) &&
      (searchTerm === '' ||
        c.invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.transaction.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleApproveMatch = async (candidate: MatchCandidate) => {
    const matchKey = `${candidate.invoice.id}-${candidate.transaction.id}`;
    const amountToAllocate = partialAmounts[matchKey] || candidate.suggestedMatchAmount;

    setIsSubmittingMatch(matchKey);
    setApiError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: candidate.transaction.id,
          invoice_id: candidate.invoice.id,
          allocated_amount: amountToAllocate,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to confirm reconciliation match');
      }

      const resData = await res.json();
      setConfirmedMatchKeys((prev) => [...prev, matchKey]);
      setSuccessMsg(`Successfully reconciled ₹${amountToAllocate} against Invoice ${candidate.invoice.invoice_number}`);
      setTimeout(() => setSuccessMsg(null), 5000);

      // Refresh live records from server
      await fetchReconData();
    } catch (err: any) {
      setApiError(err?.message || 'Failed to approve match');
    } finally {
      setIsSubmittingMatch(null);
    }
  };

  const handleReverseMatch = async (matchId: string) => {
    setIsReversing(matchId);
    setApiError(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/reconciliation?match_id=${encodeURIComponent(matchId)}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to reverse match');
      }

      setSuccessMsg('Reconciliation match reversed successfully. Balances restored.');
      setTimeout(() => setSuccessMsg(null), 5000);

      await fetchReconData();
    } catch (err: any) {
      setApiError(err?.message || 'Failed to reverse match');
    } finally {
      setIsReversing(null);
    }
  };

  const handleDismissMatch = (candidate: MatchCandidate) => {
    const matchKey = `${candidate.invoice.id}-${candidate.transaction.id}`;
    setDismissedMatches((prev) => [...prev, matchKey]);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Bank & UPI Reconciliation Engine
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Match incoming UPI payments and outgoing vendor NEFTs to tax invoices with atomic persistence and audit trails.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="success">{persistedMatches.filter((m) => m.match_status === 'confirmed').length} Confirmed</Badge>
            <Badge variant={matchCandidates.length > 0 ? 'accent' : 'outline'}>
              {matchCandidates.length} Suggestions Pending
            </Badge>
          </div>
        </div>

        {/* Status Alerts */}
        {apiError && (
          <div className="p-3.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button onClick={() => setApiError(null)} className="text-red-500 hover:text-red-700">✕</button>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
            <Input
              type="text"
              placeholder="Search by invoice # or narration..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Match Suggestions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-primary-600" />
              Automated Match Suggestions
            </h2>
            <span className="text-xs text-text-tertiary">
              Deterministic scoring based on UTR narration, exact amounts & counterparty analysis
            </span>
          </div>

          {matchCandidates.length > 0 ? (
            <div className="space-y-4">
              {matchCandidates.map((candidate, idx) => {
                const matchKey = `${candidate.invoice.id}-${candidate.transaction.id}`;
                const isHighConfidence = candidate.confidenceScore >= 0.85;
                const isSubmitting = isSubmittingMatch === matchKey;
                const allocVal = partialAmounts[matchKey] || candidate.suggestedMatchAmount;

                return (
                  <Card
                    key={idx}
                    className="border-primary-200 dark:border-primary-800/60 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="bg-primary-50/50 dark:bg-primary-950/30 px-5 py-2.5 border-b border-primary-100 dark:border-primary-900 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant={isHighConfidence ? 'success' : 'accent'}>
                          {Math.round(candidate.confidenceScore * 100)}% Match Confidence
                        </Badge>
                        <span className="font-semibold text-text-primary">
                          Type: {candidate.matchType.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <span className="text-text-secondary">
                        Suggested Settlement: <strong className="text-primary-700 dark:text-primary-300">{formatINR(candidate.suggestedMatchAmount)}</strong>
                      </span>
                    </div>

                    <CardContent className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                        {/* Target Invoice */}
                        <div className="md:col-span-5 p-3.5 rounded-xl bg-surface-secondary border border-border">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase mb-2">
                            <FileText className="h-3.5 w-3.5 text-primary-600" />
                            Target Invoice
                          </div>
                          <div className="font-bold text-text-primary text-sm font-mono">
                            {candidate.invoice.invoice_number}
                          </div>
                          <div className="font-semibold text-xs text-text-primary mt-0.5">
                            {candidate.invoice.invoice_type === 'purchase_tax_invoice'
                              ? candidate.invoice.supplier_legal_name || candidate.invoice.supplier_name
                              : candidate.invoice.customer_legal_name || candidate.invoice.buyer_name}
                          </div>
                          <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-border/50">
                            <span className="text-text-secondary">Outstanding Due:</span>
                            <span className="font-bold text-primary-600">
                              {formatINR(candidate.invoice.outstanding_balance || candidate.invoice.amount_due || '0.00')}
                            </span>
                          </div>
                        </div>

                        {/* Center Link Icon */}
                        <div className="hidden md:flex md:col-span-1 justify-center items-center text-primary-600">
                          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
                            <Link2 className="h-4 w-4" />
                          </div>
                        </div>

                        {/* Bank Record */}
                        <div className="md:col-span-5 p-3.5 rounded-xl bg-surface-secondary border border-border">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-text-secondary uppercase mb-2">
                            <CreditCard className="h-3.5 w-3.5 text-emerald-600" />
                            Bank / UPI Record
                          </div>
                          <div className="font-mono text-xs text-text-secondary">
                            {candidate.transaction.transaction_date} • {candidate.transaction.bank_account_name || 'Bank Account'}
                          </div>
                          <div className="font-semibold text-xs text-text-primary mt-0.5 line-clamp-1">
                            {candidate.transaction.description}
                          </div>
                          <div className="flex justify-between items-center text-xs mt-2 pt-2 border-t border-border/50">
                            <span className="text-text-secondary">Txn Amount:</span>
                            <span className="font-bold text-text-primary">
                              {formatINR(candidate.transaction.amount)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Reasons & Allocation */}
                      <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-semibold text-text-tertiary">Match evidence:</span>
                          {candidate.matchReasons.map((reason, rIdx) => (
                            <span
                              key={rIdx}
                              className="px-2 py-0.5 rounded-md bg-surface border border-border text-[11px] text-text-secondary"
                            >
                              ✓ {reason}
                            </span>
                          ))}
                        </div>

                        {/* Allocation & Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-text-secondary">₹</span>
                            <Input
                              type="number"
                              step="0.01"
                              value={allocVal}
                              onChange={(e) =>
                                setPartialAmounts({
                                  ...partialAmounts,
                                  [matchKey]: e.target.value,
                                })
                              }
                              className="w-24 h-7 text-xs px-2"
                              title="Custom settlement amount for partial payments"
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDismissMatch(candidate)}
                            className="text-xs text-text-tertiary hover:text-red-600 h-7"
                          >
                            <X className="h-3.5 w-3.5 mr-1" /> Dismiss
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={() => handleApproveMatch(candidate)}
                            className="text-xs h-7"
                          >
                            <Check className="h-3.5 w-3.5 mr-1 text-white" />
                            {isSubmitting ? 'Linking...' : 'Approve Match'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center border-dashed">
              <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
              <h3 className="text-base font-bold text-text-primary">
                All Eligible Records Reconciled
              </h3>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                No unmatched suggestions pending. Import additional bank statements or upload vendor invoices to discover new matches.
              </p>
            </Card>
          )}
        </div>

        {/* Audit Log of Reconciled Settlements */}
        <div className="space-y-3 pt-4">
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <History className="h-4 w-4 text-text-secondary" />
            Audit Log of Reconciled Settlements
          </h3>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                    <tr>
                      <th className="px-4 py-2.5">Settlement ID</th>
                      <th className="px-4 py-2.5">Date</th>
                      <th className="px-4 py-2.5">Method</th>
                      <th className="px-4 py-2.5 text-right">Allocated Amount</th>
                      <th className="px-4 py-2.5 text-right">Status</th>
                      <th className="px-4 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {persistedMatches.length > 0 ? (
                      persistedMatches.map((match) => (
                        <tr key={match.id} className="hover:bg-surface-tertiary/50">
                          <td className="px-4 py-3 font-mono font-bold text-text-primary">
                            {match.id.slice(0, 8)}...
                          </td>
                          <td className="px-4 py-3 text-text-secondary font-mono">
                            {match.created_at ? new Date(match.created_at).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-text-primary capitalize">
                            {(match.match_method || 'manual').replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600">
                            {formatINR(match.allocated_amount)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant={match.match_status === 'confirmed' ? 'success' : 'outline'}>
                              {match.match_status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {match.match_status === 'confirmed' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={isReversing === match.id}
                                onClick={() => handleReverseMatch(match.id)}
                                className="text-xs text-red-600 hover:text-red-700 h-6 px-2"
                                title="Safely reverse match and restore transaction/invoice balances"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                {isReversing === match.id ? 'Reversing...' : 'Reverse'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-4 py-6 text-center text-text-secondary">
                          No confirmed reconciliation matches recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatINR } from '@/lib/decimal';
import { useToast } from '@/components/ui/toast';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  CreditCard,
  Edit3,
  Check,
  ShieldCheck,
  History,
  ArrowRight
} from 'lucide-react';

interface ReviewInvoice {
  id: string;
  invoice_number: string;
  supplier_legal_name: string;
  supplier_gstin: string;
  taxable_value: string;
  cgst_amount: string;
  cgst_total: string;
  sgst_amount: string;
  sgst_total: string;
  total_amount: string;
  extraction_confidence: number;
  needs_review_reasons: string[];
  review_state: string;
}

interface AuditEntry {
  timestamp: string;
  actor: string;
  record: string;
  status: string;
}

export default function ReviewCenterPage() {
  const { showToast } = useToast();
  const [invoices, setInvoices] = useState<ReviewInvoice[]>([]);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);

  useEffect(() => {
    async function loadInvoices() {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch('/api/invoices');
        if (!res.ok) {
          setLoadError(res.status === 401 ? 'Please sign in to review your invoices.' : 'Failed to load the review queue. Please try again.');
          setInvoices([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setInvoices(Array.isArray(data.invoices) ? data.invoices : []);
        // Resolve the signed-in user so audit rows name the real actor
        try {
          const { createClient } = await import('@/lib/supabase/client');
          const supabase = createClient();
          const { data: userData } = await supabase.auth.getUser();
          if (userData?.user?.email) setUserEmail(userData.user.email);
        } catch {
          // Email display only — review actions still work without it
        }
      } catch (err) {
        console.warn('Could not load invoices for review:', err);
        setLoadError('Failed to load the review queue. Please try again.');
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    }
    loadInvoices();
  }, []);

  const pendingInvoices = invoices.filter(
    (inv) =>
      (inv.review_state === 'pending_review' ||
        (inv.needs_review_reasons && inv.needs_review_reasons.length > 0))
  );

  const handleResolve = async (invId: string) => {
    setConfirmingId(invId);
    try {
      const res = await fetch(`/api/invoices/${invId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_state: 'confirmed' }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        showToast({
          type: 'error',
          title: 'Confirmation failed',
          description: data.error || `The server rejected this confirmation (HTTP ${res.status}).`,
        });
        return;
      }

      // Server persisted the review state change and wrote an immutable
      // audit_events row — reflect it locally.
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === invId
            ? { ...inv, review_state: 'confirmed', needs_review_reasons: [] }
            : inv
        )
      );
      const confirmed = invoices.find((inv) => inv.id === invId);
      setAuditLog((prev) => [
        {
          timestamp: new Date().toLocaleString('en-IN', { hour12: false }),
          actor: userEmail || 'Signed-in user',
          record: `Invoice #${confirmed?.invoice_number || invId} (${confirmed?.supplier_legal_name || ''})`,
          status: 'Confirmed (Audit OK)',
        },
        ...prev,
      ]);
      showToast({
        type: 'success',
        title: 'Record confirmed',
        description: 'An immutable audit event was recorded for this invoice.',
      });
    } catch {
      showToast({
        type: 'error',
        title: 'Confirmation failed',
        description: 'Network error — the record was NOT confirmed. Please try again.',
      });
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-600" />
              Human Review & Exception Center
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Review low-confidence OCR scans, unverified HSN classifications, and anomalous items before return export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={pendingInvoices.length > 0 ? 'accent' : 'success'}>
              {pendingInvoices.length} Items Require Review
            </Badge>
          </div>
        </div>

        {/* Load error state */}
        {loadError && (
          <div className="p-3 rounded-lg bg-error-50 dark:bg-error-50/20 border border-error-200 dark:border-error-800 text-xs text-error-700 dark:text-error-400 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{loadError}</span>
          </div>
        )}

        {/* Review Queue Cards */}
        {pendingInvoices.length > 0 ? (
          <div className="space-y-4">
            {pendingInvoices.map((inv) => (
              <Card key={inv.id} className="border-amber-300 dark:border-amber-800 shadow-xs">
                <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 pb-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      <CardTitle className="text-sm font-bold font-mono">
                        Invoice #{inv.invoice_number}
                      </CardTitle>
                    </div>
                    <Badge variant="accent">
                      Confidence: {Math.round((inv.extraction_confidence || 0) * 100)}%
                    </Badge>
                  </div>
                  <CardDescription className="text-xs">
                    Supplier: <strong>{inv.supplier_legal_name}</strong> • GSTIN: {inv.supplier_gstin}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Flagged Reasons */}
                  <div className="p-3 rounded-lg bg-amber-100/60 dark:bg-amber-900/30 text-amber-900 dark:text-amber-200">
                    <div className="font-bold flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                      Flagged for Practitioner Verification:
                    </div>
                    <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                      {inv.needs_review_reasons?.map((reason: string, idx: number) => (
                        <li key={idx}>{reason}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Item Details Summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-surface-secondary border border-border">
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase font-semibold">Taxable Value</span>
                      <div className="font-bold text-text-primary mt-0.5">{formatINR(inv.taxable_value)}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase font-semibold">CGST (9%)</span>
                      <div className="font-medium text-text-primary mt-0.5">{formatINR(inv.cgst_amount || inv.cgst_total || '0.00')}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase font-semibold">SGST (9%)</span>
                      <div className="font-medium text-text-primary mt-0.5">{formatINR(inv.sgst_amount || inv.sgst_total || '0.00')}</div>
                    </div>
                    <div>
                      <span className="text-[10px] text-text-tertiary uppercase font-semibold">Total Amount</span>
                      <div className="font-extrabold text-primary-600 mt-0.5">{formatINR(inv.total_amount)}</div>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="text-[11px] text-text-tertiary">
                      Confirming will record an immutable audit timestamp and classify this bill as confirmed.
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolve(inv.id)}
                        disabled={confirmingId === inv.id}
                        className="text-xs"
                      >
                        <Check className="h-3.5 w-3.5 mr-1" />
                        {confirmingId === inv.id ? 'Confirming…' : 'Verify & Confirm Record'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center border-dashed">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-base font-bold text-text-primary">
              All Exceptions Verified & Cleared
            </h3>
            <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
              No low-confidence extractions or unverified tax categories remain in the review queue.
            </p>
            <div className="mt-4">
              <Link href="/exports">
                <Button variant="primary" size="sm">
                  Proceed to Return Exports →
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Audit Log Card */}
        <Card>
          <CardHeader className="pb-3 border-b border-border bg-surface-secondary/40">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5">
              <History className="h-4 w-4 text-text-secondary" />
              Recent Audit Verification Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                <tr>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">User / Action</th>
                  <th className="px-4 py-2.5">Record</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {auditLog.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-text-tertiary">
                      No verification actions recorded yet. Confirmations below are written to the immutable audit trail as they happen.
                    </td>
                  </tr>
                ) : (
                  auditLog.map((entry, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-3 font-mono text-text-secondary">{entry.timestamp}</td>
                      <td className="px-4 py-3 font-medium text-text-primary">{entry.actor}</td>
                      <td className="px-4 py-3 font-mono">{entry.record}</td>
                      <td className="px-4 py-3"><Badge variant="success">{entry.status}</Badge></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

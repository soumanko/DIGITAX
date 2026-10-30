'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DEMO_TRANSACTIONS } from '@/lib/demo-data';
import { formatINR } from '@/lib/decimal';
import { Transaction } from '@/types';
import {
  ArrowLeftRight,
  UploadCloud,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  Plus,
  HelpCircle
} from 'lucide-react';

import { parseBankStatementCSV, ParsedCsvTransaction } from '@/lib/csv-parser';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit' | 'unmatched'>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parsedPreview, setParsedPreview] = useState<ParsedCsvTransaction[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.transactions) && data.transactions.length > 0) {
          setTransactions(data.transactions);
        }
      }
    } catch (e) {
      console.warn('Could not fetch remote transactions, maintaining current view:', e);
    }
  };

  React.useEffect(() => {
    fetchTransactions();
  }, []);

  const filteredTxns = transactions.filter((t) => {
    const matchesSearch =
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'credit') return matchesSearch && (t.transaction_type === 'credit' || t.direction === 'credit');
    if (filterType === 'debit') return matchesSearch && (t.transaction_type === 'debit' || t.direction === 'debit');
    if (filterType === 'unmatched') return matchesSearch && t.reconciliation_status === 'unmatched';
    return matchesSearch;
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    setImportErrors([]);
    setParsedPreview([]);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const res = parseBankStatementCSV(text);
      setIsParsing(false);

      if (res.success) {
        setParsedPreview(res.transactions);
      } else {
        setImportErrors(res.errors);
      }
    };
    reader.onerror = () => {
      setIsParsing(false);
      setImportErrors(['Error reading CSV file']);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = async () => {
    if (parsedPreview.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: parsedPreview }),
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.transactions)) {
          setTransactions([...data.transactions, ...transactions]);
        }
        setShowImportModal(false);
        setParsedPreview([]);
        setStatusMessage(`Successfully imported ${parsedPreview.length} statement transactions.`);
        setTimeout(() => setStatusMessage(null), 5000);
      } else {
        // Fallback for local demo preview
        const newTxns: Transaction[] = parsedPreview.map((p, idx) => ({
          id: `txn-imp-${Date.now()}-${idx}`,
          shop_id: 'shop-demo-001',
          import_batch_id: null,
          external_txn_id: null,
          source: p.source,
          source_account: 'Bank Statement Import',
          bank_account_name: 'Primary Bank A/c',
          transaction_date: p.transaction_date,
          value_date: p.transaction_date,
          description: p.description,
          reference_number: p.reference_number || null,
          upi_id: null,
          direction: p.direction,
          transaction_type: p.direction,
          amount: p.amount,
          category: p.category as any,
          sub_category: undefined,
          review_state: 'confirmed' as const,
          reconciliation_status: 'unmatched' as const,
          matched_amount: '0.00',
          unmatched_amount: p.amount,
          original_row_data: null,
          notes: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));
        setTransactions([...newTxns, ...transactions]);
        setShowImportModal(false);
        setParsedPreview([]);
        setStatusMessage(`Imported ${parsedPreview.length} transactions into current session.`);
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err: any) {
      setImportErrors([err?.message || 'Failed to import transactions']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Bank & UPI Transaction Ledger
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Complete cashflow, UPI QR merchant collections, and bank debits synchronized for GST reconciliation.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowImportModal(true)}
            className="shadow-xs"
          >
            <UploadCloud className="h-4 w-4 mr-1.5" />
            Import Bank Statement (CSV)
          </Button>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Search narration, ref, or UPI ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Button
              variant={filterType === 'all' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('all')}
              className="text-xs h-8"
            >
              All Records ({transactions.length})
            </Button>
            <Button
              variant={filterType === 'credit' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('credit')}
              className="text-xs h-8"
            >
              Credits (Sales)
            </Button>
            <Button
              variant={filterType === 'debit' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('debit')}
              className="text-xs h-8"
            >
              Debits (Payments)
            </Button>
            <Button
              variant={filterType === 'unmatched' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('unmatched')}
              className="text-xs h-8 text-amber-700 dark:text-amber-400"
            >
              Unmatched ({transactions.filter((t) => t.reconciliation_status === 'unmatched').length})
            </Button>
          </div>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Narration & Reference</th>
                    <th className="px-4 py-3">Account / Source</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Amount (₹)</th>
                    <th className="px-4 py-3 text-right">Reconciliation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTxns.map((txn) => {
                    const isCredit = txn.transaction_type === 'credit';
                    return (
                      <tr key={txn.id} className="hover:bg-surface-tertiary/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-text-secondary whitespace-nowrap">
                          {txn.transaction_date}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-text-primary">
                            {txn.description}
                          </div>
                          <div className="font-mono text-[11px] text-text-tertiary">
                            Ref: {txn.reference_number || 'N/A'} {txn.upi_id ? `• UPI: ${txn.upi_id}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-text-secondary">
                          {txn.bank_account_name || 'Bank Account'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-surface-secondary border border-border text-[11px] font-medium text-text-secondary">
                            {txn.category || 'Uncategorized'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isCredit ? 'text-emerald-600' : 'text-text-primary'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5 text-text-tertiary" />
                            )}
                            {formatINR(txn.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Badge
                            variant={
                              txn.reconciliation_status === 'matched'
                                ? 'success'
                                : txn.reconciliation_status === 'partial'
                                ? 'accent'
                                : 'outline'
                            }
                          >
                            {txn.reconciliation_status === 'matched' ? 'Reconciled' : 'Unmatched'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Real CSV Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <Card className="max-w-xl w-full shadow-2xl border-border">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary-600" />
                  Import Bank / UPI Statement CSV
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload standard bank export statements (HDFC, SBI, ICICI, Axis, PhonePe, Paytm QR).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                {importErrors.length > 0 && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                    {importErrors.map((err, i) => (
                      <div key={i}>{err}</div>
                    ))}
                  </div>
                )}

                <div className="p-4 rounded-xl border-2 border-dashed border-border text-center space-y-2 bg-surface-secondary/40 relative">
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="h-8 w-8 text-primary-600 mx-auto" />
                  <div className="font-semibold text-text-primary">
                    {isParsing ? 'Parsing statement CSV...' : 'Click to select CSV file, or drag & drop'}
                  </div>
                  <div className="text-[11px] text-text-tertiary">
                    Parses dates, narrations, debits, credits, and UTR reference codes automatically
                  </div>
                </div>

                {parsedPreview.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between font-bold text-text-primary">
                      <span>Statement Preview ({parsedPreview.length} rows found)</span>
                      <span className="text-[11px] font-normal text-text-secondary">Ready to import</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                      {parsedPreview.slice(0, 15).map((row, idx) => (
                        <div key={idx} className="p-2 flex items-center justify-between text-[11px] hover:bg-surface-secondary">
                          <div>
                            <span className="font-mono text-text-tertiary mr-2">{row.transaction_date}</span>
                            <span className="font-medium text-text-primary">{row.description}</span>
                          </div>
                          <span className={`font-mono font-semibold ${row.direction === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                            {row.direction === 'credit' ? '+' : '-'}₹{row.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2 border-t border-border">
                  <Button variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmImport}
                    disabled={parsedPreview.length === 0}
                    isLoading={isSubmitting}
                  >
                    Confirm Import ({parsedPreview.length} Transactions)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

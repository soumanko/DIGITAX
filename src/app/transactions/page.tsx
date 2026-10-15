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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'credit' | 'debit' | 'unmatched'>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [simulatedFileName, setSimulatedFileName] = useState<string | null>(null);

  const filteredTxns = transactions.filter((t) => {
    const matchesSearch =
      (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.reference_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.category || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'credit') return matchesSearch && t.transaction_type === 'credit';
    if (filterType === 'debit') return matchesSearch && t.transaction_type === 'debit';
    if (filterType === 'unmatched') return matchesSearch && t.reconciliation_status === 'unmatched';
    return matchesSearch;
  });

  const handleSimulateCSVImport = () => {
    setSimulatedFileName('HDFC_Statement_Oct2026.csv');
    setTimeout(() => {
      const newTxn: Transaction = {
        id: `txn-sim-${Date.now()}`,
        shop_id: 'shop-demo-001',
        import_batch_id: null,
        external_txn_id: null,
        source: 'bank_import',
        source_account: 'HDFC Current A/c ...8921',
        bank_account_name: 'HDFC Current A/c ...8921',
        transaction_date: '2026-10-14',
        value_date: '2026-10-14',
        description: 'UPI/3299410921/BRITANNIA DISTRIBUTOR/PAYMENT',
        reference_number: 'UPI/3299410921',
        upi_id: null,
        direction: 'debit',
        transaction_type: 'debit',
        amount: '21830.00',
        category: 'supplier_payment',
        sub_category: 'Vendor Payment',
        review_state: 'pending_review',
        reconciliation_status: 'unmatched',
        matched_amount: '0.00',
        unmatched_amount: '21830.00',
        original_row_data: null,
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setTransactions([newTxn, ...transactions]);
      setShowImportModal(false);
      setSimulatedFileName(null);
    }, 1000);
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

        {/* Simulated CSV Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <Card className="max-w-lg w-full shadow-2xl border-border">
              <CardHeader className="border-b border-border pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary-600" />
                  Import Bank / UPI Statement CSV
                </CardTitle>
                <CardDescription className="text-xs">
                  Upload standard bank export statements (HDFC, SBI, ICICI, PhonePe, Paytm QR).
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 space-y-4 text-xs">
                <div className="p-4 rounded-xl border-2 border-dashed border-border text-center space-y-2 bg-surface-secondary/40">
                  <UploadCloud className="h-8 w-8 text-primary-600 mx-auto" />
                  <div className="font-semibold text-text-primary">
                    Drop CSV here, or browse files
                  </div>
                  <div className="text-[11px] text-text-tertiary">
                    Supports HDFC, ICICI, Axis, SBI, PhonePe Merchant exports (.csv, .xlsx)
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-secondary border border-border space-y-2">
                  <div className="font-bold text-text-primary">Detected Column Mappings:</div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>Date: <span className="font-mono text-emerald-600">Txn Date</span></div>
                    <div>Narration: <span className="font-mono text-emerald-600">Description</span></div>
                    <div>Debit/Credit: <span className="font-mono text-emerald-600">Amount / Type</span></div>
                    <div>Ref/UTR: <span className="font-mono text-emerald-600">Reference No</span></div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setShowImportModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSimulateCSVImport}
                    isLoading={!!simulatedFileName}
                  >
                    {simulatedFileName ? 'Parsing & Mapping...' : 'Import Sample HDFC Statement'}
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

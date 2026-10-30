'use client';

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DEMO_INVOICES } from '@/lib/demo-data';
import { formatINR } from '@/lib/decimal';
import { Invoice } from '@/types';
import {
  UploadCloud,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Clock,
  Sparkles,
  Eye,
  Check,
  X,
  FileCheck2,
  Camera
} from 'lucide-react';

export default function DocumentsPage() {
  const [invoices, setInvoices] = useState(DEMO_INVOICES);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(DEMO_INVOICES[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'purchase' | 'sales'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [newInvNum, setNewInvNum] = useState('');
  const [newInvParty, setNewInvParty] = useState('');
  const [newInvGstin, setNewInvGstin] = useState('');
  const [newInvTaxable, setNewInvTaxable] = useState('10000.00');
  const [newInvRate, setNewInvRate] = useState('18');
  const [newInvDirection, setNewInvDirection] = useState<'purchase' | 'sales'>('purchase');

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      Boolean(inv.supplier_legal_name && inv.supplier_legal_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      Boolean(inv.customer_legal_name && inv.customer_legal_name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (filterType === 'purchase') return inv.invoice_type?.startsWith('purchase') ?? true;
    if (filterType === 'sales') return inv.invoice_type?.startsWith('sales') ?? true;
    return true;
  });

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await fetch('/api/invoices');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.invoices) && data.invoices.length > 0) {
            setInvoices(data.invoices);
            setSelectedInvoice(data.invoices[0]);
          }
        }
      } catch (e) {
        console.warn('Could not load invoices from API:', e);
      }
    }
    loadInvoices();
  }, []);

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', filterType === 'sales' ? 'sales_invoice' : 'purchase_invoice');

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || 'Failed to upload document');
        setIsUploading(false);
        return;
      }

      setUploadSuccess(true);
      // Pre-fill manual invoice entry with file name
      setNewInvNum(file.name.replace(/\.[^/.]+$/, '').toUpperCase());
      setShowManualModal(true);
    } catch (err: any) {
      setUploadError(err?.message || 'Error uploading document to server');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateManualInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const taxable = parseFloat(newInvTaxable) || 0;
    const rate = parseFloat(newInvRate) || 18;
    const taxAmt = (taxable * rate) / 100;
    const halfTax = (taxAmt / 2).toFixed(2);
    const total = (taxable + taxAmt).toFixed(2);

    const payload = {
      invoice_number: newInvNum || `INV-${Date.now()}`,
      invoice_date: new Date().toISOString().split('T')[0],
      direction: newInvDirection,
      supplier_name: newInvDirection === 'purchase' ? newInvParty || 'Wholesale Supplier' : undefined,
      supplier_gstin: newInvDirection === 'purchase' ? (newInvGstin || undefined) : undefined,
      buyer_name: newInvDirection === 'sales' ? newInvParty || 'Retail Counter' : undefined,
      buyer_gstin: newInvDirection === 'sales' ? (newInvGstin || undefined) : undefined,
      subtotal: taxable.toFixed(2),
      taxable_value: taxable.toFixed(2),
      cgst_total: halfTax,
      sgst_total: halfTax,
      igst_total: '0.00',
      total_amount: total,
      lines: [
        {
          description: `${newInvDirection === 'purchase' ? 'Stock Inward' : 'Retail Sales'} (GST ${rate}%)`,
          taxable_value: taxable.toFixed(2),
          gst_rate: rate.toString(),
          cgst_amount: halfTax,
          sgst_amount: halfTax,
          igst_amount: '0.00',
          total_amount: total,
        },
      ],
    };

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.invoice) {
          setInvoices([data.invoice, ...invoices]);
          setSelectedInvoice(data.invoice);
        }
      }
    } catch (err) {
      console.warn('Invoice API save notice:', err);
    }

    setShowManualModal(false);
  };

  const handleConfirmInvoice = (invId: string) => {
    setInvoices(
      invoices.map((inv) =>
        inv.id === invId ? { ...inv, review_state: 'confirmed', needs_review_reasons: [] } : inv
      )
    );
    if (selectedInvoice?.id === invId) {
      setSelectedInvoice({ ...selectedInvoice, review_state: 'confirmed', needs_review_reasons: [] });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
              Invoices & Document Repository
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Upload paper bills, PDF invoices, and receipts. Extracted with OCR confidence scoring and arithmetic validation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setNewInvNum(`INV-${Date.now().toString().slice(-6)}`);
                setShowManualModal(true);
              }}
            >
              + Manual Invoice
            </Button>

            <div className="relative">
              <input
                type="file"
                id="file-upload"
                accept="image/*,application/pdf"
                onChange={handleDocumentUpload}
                className="hidden"
              />
              <label htmlFor="file-upload">
                <Button
                  variant="primary"
                  size="sm"
                  className="cursor-pointer shadow-xs"
                  isLoading={isUploading}
                >
                  <UploadCloud className="h-4 w-4 mr-1.5" />
                  {isUploading ? 'Uploading & Processing...' : 'Upload Document'}
                </Button>
              </label>
            </div>
          </div>
        </div>

        {uploadError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
              <strong>Upload error:</strong> {uploadError}
            </span>
            <button onClick={() => setUploadError(null)} className="text-red-700 hover:underline font-bold">
              Dismiss
            </button>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <strong>Document Uploaded:</strong> Stored securely in shop repository and ready for extraction review.
            </span>
            <button onClick={() => setUploadSuccess(false)} className="text-emerald-700 hover:underline font-bold">
              Dismiss
            </button>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-text-tertiary" />
            <Input
              placeholder="Search by invoice # or supplier..."
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
              All Invoices ({invoices.length})
            </Button>
            <Button
              variant={filterType === 'purchase' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('purchase')}
              className="text-xs h-8"
            >
              Purchases (ITC)
            </Button>
            <Button
              variant={filterType === 'sales' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilterType('sales')}
              className="text-xs h-8"
            >
              Sales (Outward)
            </Button>
          </div>
        </div>

        {/* Master-Detail Split Screen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Invoice List (7 Cols) */}
          <div className="lg:col-span-7">
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-surface-secondary text-text-secondary uppercase border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5">Invoice #</th>
                        <th className="px-4 py-2.5">Party / GSTIN</th>
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Total Amount</th>
                        <th className="px-4 py-2.5">Confidence</th>
                        <th className="px-4 py-2.5 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInvoices.map((inv) => {
                        const isSelected = selectedInvoice?.id === inv.id;
                        return (
                          <tr
                            key={inv.id}
                            onClick={() => setSelectedInvoice(inv)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-primary-50/70 dark:bg-primary-950/40 font-medium'
                                : 'hover:bg-surface-tertiary'
                            }`}
                          >
                            <td className="px-4 py-3 font-mono text-text-primary">
                              {inv.invoice_number}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-text-primary truncate max-w-[150px]">
                                {inv.invoice_type === 'purchase_tax_invoice'
                                  ? inv.supplier_trade_name || inv.supplier_legal_name
                                  : inv.customer_trade_name || inv.customer_legal_name}
                              </div>
                              <div className="font-mono text-[10px] text-text-tertiary">
                                {inv.invoice_type === 'purchase_tax_invoice'
                                  ? inv.supplier_gstin
                                  : inv.customer_gstin || 'Retail Counter'}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-text-secondary">
                              {inv.invoice_date}
                            </td>
                            <td className="px-4 py-3 font-bold text-text-primary">
                              {formatINR(inv.total_amount)}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  inv.extraction_confidence && inv.extraction_confidence >= 0.95
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : inv.extraction_confidence && inv.extraction_confidence >= 0.85
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                }`}
                              >
                                {Math.round((inv.extraction_confidence || 0) * 100)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Badge
                                variant={
                                  inv.review_state === 'confirmed'
                                    ? 'success'
                                    : inv.review_state === 'pending_review'
                                    ? 'accent'
                                    : 'destructive'
                                }
                              >
                                {inv.review_state.replace('_', ' ')}
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
          </div>

          {/* Invoice Extraction Detail & Arithmetic Inspector (5 Cols) */}
          <div className="lg:col-span-5">
            {selectedInvoice ? (
              <Card className="border-border shadow-md">
                <CardHeader className="border-b border-border bg-surface-secondary/40 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        {selectedInvoice.invoice_type === 'purchase_tax_invoice' ? 'Purchase Bill' : 'Sales Invoice'}
                      </span>
                      <CardTitle className="text-base font-extrabold font-mono mt-0.5">
                        {selectedInvoice.invoice_number}
                      </CardTitle>
                    </div>
                    <Badge
                      variant={selectedInvoice.review_state === 'confirmed' ? 'success' : 'accent'}
                    >
                      {selectedInvoice.review_state.replace('_', ' ')}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 text-xs">
                  {/* Confidence & Review Alert */}
                  {selectedInvoice.needs_review_reasons && selectedInvoice.needs_review_reasons.length > 0 && (
                    <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                        Human Verification Recommended
                      </div>
                      <ul className="list-disc pl-4 text-[11px] space-y-0.5">
                        {selectedInvoice.needs_review_reasons.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Supplier & Customer Details */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-secondary border border-border">
                    <div>
                      <span className="text-[10px] uppercase font-semibold text-text-tertiary block">
                        Supplier / Vendor
                      </span>
                      <div className="font-bold text-text-primary mt-0.5">
                        {selectedInvoice.supplier_legal_name}
                      </div>
                      <div className="font-mono text-[11px] text-text-secondary">
                        GSTIN: {selectedInvoice.supplier_gstin || 'None'}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-semibold text-text-tertiary block">
                        Customer / Buyer
                      </span>
                      <div className="font-bold text-text-primary mt-0.5">
                        {selectedInvoice.customer_legal_name}
                      </div>
                      <div className="font-mono text-[11px] text-text-secondary">
                        GSTIN: {selectedInvoice.customer_gstin || 'Unregistered'}
                      </div>
                    </div>
                  </div>

                  {/* Arithmetic Breakdown */}
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="font-bold text-text-primary">Tax & Value Breakdown</div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">Taxable Value</span>
                      <span className="font-semibold text-text-primary">
                        {formatINR(selectedInvoice.taxable_value)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">Central GST (CGST)</span>
                      <span className="font-medium text-text-primary">
                        {formatINR(selectedInvoice.cgst_amount || selectedInvoice.cgst_total || '0.00')}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">State GST (SGST)</span>
                      <span className="font-medium text-text-primary">
                        {formatINR(selectedInvoice.sgst_amount || selectedInvoice.sgst_total || '0.00')}
                      </span>
                    </div>
                    {parseFloat(selectedInvoice.igst_amount || selectedInvoice.igst_total || '0.00') > 0 && (
                      <div className="flex justify-between py-1 border-b border-border/40">
                        <span className="text-text-secondary">Integrated GST (IGST)</span>
                        <span className="font-medium text-text-primary">
                          {formatINR(selectedInvoice.igst_amount || selectedInvoice.igst_total || '0.00')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 text-sm font-extrabold">
                      <span className="text-text-primary">Total Invoice Amount</span>
                      <span className="text-primary-600">
                        {formatINR(selectedInvoice.total_amount)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex gap-2">
                    {selectedInvoice.review_state !== 'confirmed' ? (
                      <Button
                        variant="primary"
                        size="sm"
                        className="w-full"
                        onClick={() => handleConfirmInvoice(selectedInvoice.id)}
                      >
                        <Check className="h-4 w-4 mr-1.5 text-white" />
                        Confirm Extraction & Add to GST Ledger
                      </Button>
                    ) : (
                      <div className="w-full text-center py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        Confirmed & Added to Ledger
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="p-8 text-center border border-dashed border-border rounded-xl text-text-tertiary">
                Select an invoice on the left to inspect extraction details.
              </div>
            )}
          </div>
        </div>

        {/* Manual Invoice Entry Modal */}
        {showManualModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-surface border border-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-lg font-bold text-text-primary">Create Invoice Record</h3>
                <button
                  onClick={() => setShowManualModal(false)}
                  className="text-text-tertiary hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateManualInvoice} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      Invoice Direction
                    </label>
                    <select
                      value={newInvDirection}
                      onChange={(e) => setNewInvDirection(e.target.value as 'purchase' | 'sales')}
                      className="w-full text-xs rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="purchase">Purchase (Inward / ITC)</option>
                      <option value="sales">Sales (Outward / Tax Liability)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      Invoice Number
                    </label>
                    <Input
                      value={newInvNum}
                      onChange={(e) => setNewInvNum(e.target.value)}
                      placeholder="e.g. INV-2024-001"
                      className="text-xs h-9"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      {newInvDirection === 'purchase' ? 'Supplier Name' : 'Customer Name'}
                    </label>
                    <Input
                      value={newInvParty}
                      onChange={(e) => setNewInvParty(e.target.value)}
                      placeholder={newInvDirection === 'purchase' ? 'Supplier Business' : 'Customer Name'}
                      className="text-xs h-9"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      GSTIN (Optional)
                    </label>
                    <Input
                      value={newInvGstin}
                      onChange={(e) => setNewInvGstin(e.target.value.toUpperCase())}
                      placeholder="27ABCDE1234F1Z5"
                      className="text-xs h-9 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      Taxable Value (₹)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newInvTaxable}
                      onChange={(e) => setNewInvTaxable(e.target.value)}
                      className="text-xs h-9"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-text-secondary block mb-1">
                      GST Rate (%)
                    </label>
                    <select
                      value={newInvRate}
                      onChange={(e) => setNewInvRate(e.target.value)}
                      className="w-full text-xs rounded-lg border border-border bg-surface px-3 py-2 text-text-primary focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="0">0% (Nil / Exempt)</option>
                      <option value="5">5% (CGST 2.5% + SGST 2.5%)</option>
                      <option value="12">12% (CGST 6% + SGST 6%)</option>
                      <option value="18">18% (CGST 9% + SGST 9%)</option>
                      <option value="28">28% (CGST 14% + SGST 14%)</option>
                    </select>
                  </div>
                </div>

                <div className="p-3 bg-surface-secondary rounded-lg border border-border text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Estimated Tax:</span>
                    <span className="font-semibold text-text-primary">
                      {formatINR(((parseFloat(newInvTaxable) || 0) * (parseFloat(newInvRate) || 0)) / 100)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-secondary">Total Amount:</span>
                    <span className="font-bold text-primary-600">
                      {formatINR(
                        (parseFloat(newInvTaxable) || 0) +
                          ((parseFloat(newInvTaxable) || 0) * (parseFloat(newInvRate) || 0)) / 100
                      )}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" variant="primary" size="sm">
                    Save Invoice Record
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

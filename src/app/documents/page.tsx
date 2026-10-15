'use client';

import React, { useState } from 'react';
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

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.supplier_legal_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.customer_legal_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'purchase') return matchesSearch && inv.invoice_type === 'purchase_tax_invoice';
    if (filterType === 'sales') return matchesSearch && inv.invoice_type === 'sales_tax_invoice';
    return matchesSearch;
  });

  const handleSimulatedUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadSuccess(false);

    // Simulate OCR Extraction pipeline with confidence scoring
    setTimeout(() => {
      const newInvoice: Invoice = {
        id: `inv-sim-${Date.now()}`,
        document_id: `doc-sim-${Date.now()}`,
        shop_id: 'shop-demo-001',
        direction: 'purchase',
        invoice_number: `ITC/2026/${Math.floor(1000 + Math.random() * 9000)}`,
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
        invoice_type: 'purchase_tax_invoice',
        supplier_name: 'ITC Limited Foods Division',
        supplier_gstin: '27AAACI1681G1Z1',
        supplier_legal_name: 'ITC Limited Foods Division',
        supplier_trade_name: 'ITC Wholesale Hub',
        supplier_address: 'Kurla West, Mumbai 400070',
        buyer_name: 'Shree Krishna Traders',
        buyer_gstin: '27AABCS1429B1ZB',
        customer_gstin: '27AABCS1429B1ZB',
        customer_legal_name: 'Shree Krishna Traders',
        customer_trade_name: 'Shree Krishna Traders',
        customer_address: 'Shop No. 4, Station Road, Dadar West, Mumbai 400028',
        place_of_supply_state_code: '27',
        is_inter_state: false,
        is_reverse_charge: false,
        subtotal: '22400.00',
        discount_total: '0.00',
        taxable_value: '22400.00',
        cgst_total: '1344.00',
        cgst_amount: '1344.00',
        sgst_total: '1344.00',
        sgst_amount: '1344.00',
        igst_total: '0.00',
        igst_amount: '0.00',
        cess_total: '0.00',
        cess_amount: '0.00',
        total_tax_amount: '2688.00',
        round_off_amount: '0.00',
        total_amount: '25088.00',
        amount_paid: '0.00',
        paid_amount: '0.00',
        amount_due: '25088.00',
        outstanding_balance: '25088.00',
        payment_status: 'unpaid',
        review_state: 'pending_review',
        extraction_confidence: 0.92,
        needs_review_reasons: ['Verify 12% GST rate on Aashirvaad Atta / Sunfeast'],
        notes: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setInvoices([newInvoice, ...invoices]);
      setSelectedInvoice(newInvoice);
      setIsUploading(false);
      setUploadSuccess(true);
    }, 1200);
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

          <div className="relative">
            <input
              type="file"
              id="file-upload"
              accept="image/*,application/pdf"
              onChange={handleSimulatedUpload}
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
                {isUploading ? 'Extracting OCR...' : 'Upload Purchase / Sales Bill'}
              </Button>
            </label>
          </div>
        </div>

        {uploadSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between animate-fade-in">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <strong>OCR Extraction Succeeded:</strong> ITC Limited invoice processed with 92% confidence score.
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
      </div>
    </DashboardLayout>
  );
}

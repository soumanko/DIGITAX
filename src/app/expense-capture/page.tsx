'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  UploadCloud,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { createClient } from '@/lib/supabase/client';

const EXPENSE_CATEGORIES: Array<{ value: string; label: string }> = [
  { value: 'business_purchase', label: 'Business purchase' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'loan_borrowing', label: 'Loan / borrowing' },
  { value: 'owner_withdrawal', label: 'Owner withdrawal' },
  { value: 'personal', label: 'Personal' },
  { value: 'cash_entry', label: 'Cash entry' },
];

const ALLOWED_RECEIPT_MIME = ['application/pdf', 'image/jpeg', 'image/png'];
const MAX_RECEIPT_SIZE = 10 * 1024 * 1024; // 10MB

function initialsOf(email: string | null): string {
  if (!email) return '—';
  const local = email.split('@')[0] || '';
  return (local.slice(0, 2) || '—').toUpperCase();
}

export default function ExpenseCapture() {
  const router = useRouter();
  const { showToast } = useToast();

  const [businessName, setBusinessName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [merchant, setMerchant] = useState('');
  const [date, setDate] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('business_purchase');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [notes, setNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [receipt, setReceipt] = useState<{ name: string; size: number; documentId: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      await Promise.resolve();
      if (!active) return;
      // Default the expense date to today, client-side only (no prerender)
      setDate(new Date().toISOString().slice(0, 10));
      try {
        const res = await fetch('/api/shops');
        if (active && res.ok) {
          const data = await res.json();
          if (data?.shop?.name) setBusinessName(data.shop.name);
        }
      } catch {
        // Sidebar falls back to neutral copy
      }
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (active && data?.user?.email) setUserEmail(data.user.email);
      } catch {
        // Sidebar falls back to neutral copy
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const sidebarBusiness = businessName || 'Your business';
  const sidebarUserName = userEmail || 'Not signed in';
  const sidebarUserRole = userEmail ? 'Signed in' : 'Not signed in';
  const avatarInitials = initialsOf(userEmail);

  async function handleSaveExpense() {
    const amountNum = parseFloat(amount.replace(/,/g, ''));
    if (!merchant.trim() && !notes.trim()) {
      showToast({ type: 'error', title: 'Missing details', description: 'Add a merchant or a description for the expense.' });
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      showToast({ type: 'error', title: 'Invalid amount', description: 'Enter an amount greater than zero.' });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      showToast({ type: 'error', title: 'Invalid date', description: 'Pick a valid expense date.' });
      return;
    }

    setSaving(true);
    try {
      const description = [merchant.trim(), notes.trim()].filter(Boolean).join(' — ') || 'Manual expense entry';
      const docRef = receipt?.documentId ? ` Receipt: ${receipt.documentId}` : '';
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: [
            {
              transaction_date: date,
              description: description.slice(0, 500),
              amount: amountNum.toFixed(2),
              direction: 'debit',
              category,
              source: 'expense_capture',
              source_account: paymentAccount.trim() || null,
              bank_account_name: paymentAccount.trim() || null,
              notes: (notes.trim() + docRef).trim() || null,
            },
          ],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          type: 'error',
          title: 'Save failed',
          description:
            res.status === 401
              ? 'Please sign in to record expenses.'
              : data.error || `The server rejected the expense (HTTP ${res.status}).`,
        });
        return;
      }
      showToast({ type: 'success', title: 'Expense saved', description: 'Recorded in Transactions — match it to an invoice from Reconciliation.' });
      router.push('/transactions');
    } catch {
      showToast({ type: 'error', title: 'Save failed', description: 'Network error — the expense was NOT saved. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function handleReceiptUpload(file: File) {
    if (!ALLOWED_RECEIPT_MIME.includes(file.type)) {
      showToast({ type: 'error', title: 'Unsupported file type', description: 'Receipts: PDF, JPEG or PNG up to 10 MB.' });
      return;
    }
    if (file.size > MAX_RECEIPT_SIZE) {
      showToast({ type: 'error', title: 'File too large', description: 'Receipts must be 10 MB or smaller.' });
      return;
    }
    setUploadingReceipt(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'receipt');
      const res = await fetch('/api/documents', { method: 'POST', body: formData });
      const uploadData = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast({
          type: 'error',
          title: 'Receipt upload failed',
          description: uploadData.error || `The server rejected the upload (HTTP ${res.status}).`,
        });
        return;
      }
      setReceipt({ name: file.name, size: file.size, documentId: uploadData.document?.id || null });
      showToast({ type: 'success', title: 'Receipt uploaded', description: 'Stored in your private business vault for later review.' });
    } catch {
      showToast({ type: 'error', title: 'Receipt upload failed', description: 'Network error uploading the receipt.' });
    } finally {
      setUploadingReceipt(false);
    }
  }

  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground w-full h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <aside className="bg-sidebar text-sidebar-foreground border-y border-r border-border flex fixed inset-y-0 left-0 px-4 py-5 flex-col w-64">
          <div className="flex px-3 items-center h-8">
            <span className="font-semibold text-foreground text-lg tracking-[0.18em]">
              DIGITAX
            </span>
          </div>
          <button className="text-left rounded-md bg-card text-foreground text-sm border border-border flex mt-6 px-3 justify-between items-center w-full h-11">
            <span className="flex items-center gap-2 min-w-0">
              <Building2 className="text-muted-foreground shrink-0 size-4" />
              <span className="text-ellipsis whitespace-nowrap overflow-hidden">
                {sidebarBusiness}
              </span>
            </span>
            <ChevronsUpDown className="text-muted-foreground shrink-0 size-4" />
          </button>
          <nav className="flex mt-7 flex-col flex-1 gap-1">
            <a
              href="/dashboard"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/dashboard')}
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </a>
            <a
              href="/transactions"
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
            >
              <ArrowLeftRight className="size-4" />
              <span>Transactions</span>
            </a>
            <a
              href="/gst"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/gst')}
            >
              <ReceiptText className="size-4" />
              <span>{`GST & Tax`}</span>
            </a>
            <a
              href="/banking"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/banking')}
            >
              <Landmark className="size-4" />
              <span>Banking</span>
            </a>
            <a
              href="/reports"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/reports')}
            >
              <BarChart3 className="size-4" />
              <span>Reports</span>
            </a>
            <a
              href="/contacts"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/contacts')}
            >
              <Users className="size-4" />
              <span>Contacts</span>
            </a>
            <a
              href="/settings"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/settings')}
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </a>
          </nav>
          <div className="border-x border-t border-b flex pt-4 flex-col gap-2">
            <a
              href="/faq"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <CircleHelp className="size-4" />
              <span>{`Help & support`}</span>
            </a>
            <button className="text-left rounded-md flex px-3 py-2 items-center gap-3 hover:bg-accent active:bg-muted hover:active:bg-muted">
              <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8">
                {avatarInitials}
              </span>
              <span className="min-w-0">
                <span className="font-medium text-ellipsis whitespace-nowrap text-foreground text-sm block overflow-hidden">
                  {sidebarUserName}
                </span>
                <span className="text-ellipsis whitespace-nowrap text-muted-foreground text-xs block overflow-hidden">
                  {sidebarUserRole}
                </span>
              </span>
              <MoreHorizontal className="text-muted-foreground ml-auto shrink-0 size-4" />
            </button>
          </div>
        </aside>
        <div className="ml-64 min-h-screen">
          <header className="bg-background border-t border-r border-b border-b-border border-l-border flex fixed z-10 top-0 right-0 left-64 px-8 justify-between items-center h-16">
            <div className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">DIGITAX</span>
              <ChevronRight className="text-muted-foreground size-4" />
              <span className="text-muted-foreground">Transactions</span>
              <ChevronRight className="text-muted-foreground size-4" />
              <span className="font-medium text-foreground">New expense</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="rounded-md bg-card border border-border flex px-3 items-center gap-2 w-64 h-9">
                <Search className="text-muted-foreground size-4" />
                <input
                  type="search"
                  placeholder="Search"
                  className="bg-transparent text-foreground text-sm outline-none w-full placeholder:text-muted-foreground"
                />
              </label>
              <button
                aria-label="Notifications"
                className="rounded-md text-muted-foreground flex justify-center items-center size-9 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <Bell className="size-4" />
              </button>
              <button
                aria-label="Open profile"
                className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center size-8"
              >
                {avatarInitials}
              </button>
            </div>
          </header>
          <main className="px-8 pt-24 pb-8">
            <div className="mb-8">
              <h1 className="font-semibold text-2xl tracking-tight">
                Add an expense
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Capture the details now, match the receipt later. Saved expenses appear in Transactions.
              </p>
            </div>
            <div className="grid gap-6 grid-cols-2">
              <Card className="shadow-xs rounded-lg border-border">
                <CardHeader>
                  <CardTitle>Expense details</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="merchant">Merchant</Label>
                    <Input id="merchant" placeholder="e.g. AWS India Pvt. Ltd." value={merchant} onChange={(e) => setMerchant(e.target.value)} />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input id="amount" inputMode="decimal" placeholder="e.g. 42180.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            {c.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="payment-account">Payment account (optional)</Label>
                    <Input id="payment-account" placeholder="e.g. ICICI Current Account" value={paymentAccount} onChange={(e) => setPaymentAccount(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      placeholder="What was this expense for?"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                  <div className="flex pt-2 items-center gap-3">
                    <Button onClick={() => handleSaveExpense()} isLoading={saving}>
                      {saving ? 'Saving…' : 'Save expense'}
                    </Button>
                    <Button variant="secondary" onClick={() => router.push('/transactions')}>
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-xs rounded-lg border-border">
                <CardHeader>
                  <CardTitle>Receipt</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <label className="text-center rounded-md bg-muted/40 border border-dashed border-border flex px-6 flex-col justify-center items-center min-h-56 cursor-pointer hover:bg-muted/60 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleReceiptUpload(file);
                        e.target.value = '';
                      }}
                    />
                    <UploadCloud className="text-muted-foreground mb-4 size-8" />
                    <p className="font-medium text-sm">
                      {uploadingReceipt ? 'Uploading receipt…' : 'Drop a receipt here or browse files'}
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                      Supported formats PDF, JPG, PNG up to 10 MB
                    </p>
                  </label>
                  {receipt ? (
                    <div className="rounded-md bg-card border border-border flex p-4 justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{receipt.name}</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          {(receipt.size / (1024 * 1024)).toFixed(1)} MB
                          {receipt.documentId ? (
                            <span className="ml-2 text-[10px] text-muted-foreground">
                              Doc ID: {receipt.documentId}
                            </span>
                          ) : null}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          OCR data extraction not yet available — enter expense details manually above.
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-primary text-sm">Uploaded</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-xs text-center">
                      Uploaded receipts go to your Documents vault and can be reviewed later.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            <Card className="shadow-xs rounded-lg border-border mt-6">
              <CardHeader>
                <CardTitle>Match to your books</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-card border border-border flex p-4 justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    After saving, put this expense against a bank transaction from the Reconciliation queue.
                  </span>
                  <Button onClick={() => router.push('/reconciliation')}>
                    Open reconciliation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

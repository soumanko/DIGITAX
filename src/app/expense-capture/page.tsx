'use client';

import React from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
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

export default function ExpenseCapture() {
  const router = useRouter();
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
                Aster Labs Pvt. Ltd.
              </span>
            </span>
            <ChevronsUpDown className="text-muted-foreground shrink-0 size-4" />
          </button>
          <nav className="flex mt-7 flex-col flex-1 gap-1">
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/dashboard')}
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </a>
            <a
              href="#"
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
            >
              <ArrowLeftRight className="size-4" />
              <span>Transactions</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/gst')}
            >
              <ReceiptText className="size-4" />
              <span>{`GST & Tax`}</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/banking')}
            >
              <Landmark className="size-4" />
              <span>Banking</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/reports')}
            >
              <BarChart3 className="size-4" />
              <span>Reports</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/contacts')}
            >
              <Users className="size-4" />
              <span>Contacts</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/settings')}
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </a>
          </nav>
          <div className="border-x border-t border-b flex pt-4 flex-col gap-2">
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <CircleHelp className="size-4" />
              <span>{`Help & support`}</span>
            </a>
            <button className="text-left rounded-md flex px-3 py-2 items-center gap-3 hover:bg-accent active:bg-muted hover:active:bg-muted">
              <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8">
                AK
              </span>
              <span className="min-w-0">
                <span className="font-medium text-ellipsis whitespace-nowrap text-foreground text-sm block overflow-hidden">
                  Ananya Kapoor
                </span>
                <span className="text-ellipsis whitespace-nowrap text-muted-foreground text-xs block overflow-hidden">
                  Admin
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
                AK
              </button>
            </div>
          </header>
          <main className="px-8 pt-24 pb-8">
            <div className="mb-8">
              <h1 className="font-semibold text-2xl tracking-tight">
                Add an expense
              </h1>
              <p className="text-muted-foreground text-sm mt-2">
                Capture the details now, match the receipt later.
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
                    <Input id="merchant" defaultValue="AWS India Pvt. Ltd." />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" defaultValue="23 Jun 2024" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="amount">Amount</Label>
                      <Input id="amount" defaultValue="₹42,180" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Category</Label>
                    <Select defaultValue="Software & subscriptions">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Software & subscriptions">{`Software & subscriptions`}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Payment account</Label>
                    <Select defaultValue="ICICI Current Account">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ICICI Current Account">
                          ICICI Current Account
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      defaultValue="Monthly cloud hosting and storage"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox id="billable" defaultChecked={false} />
                    <Label htmlFor="billable">Billable to client</Label>
                  </div>
                  <div className="flex pt-2 items-center gap-3">
                    <Button>Save expense</Button>
                    <Button variant="secondary">Cancel</Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-xs rounded-lg border-border">
                <CardHeader>
                  <CardTitle>Receipt</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="text-center rounded-md bg-muted/40 border border-dashed border-border flex px-6 flex-col justify-center items-center min-h-56">
                    <UploadCloud className="text-muted-foreground mb-4 size-8" />
                    <p className="font-medium text-sm">
                      Drop a receipt here or browse files
                    </p>
                    <p className="text-muted-foreground text-xs mt-2">
                      Supported formats PDF, JPG, PNG up to 10 MB
                    </p>
                  </div>
                  <div className="rounded-md bg-card border border-border flex p-4 justify-between items-center">
                    <div>
                      <p className="font-medium text-sm">
                        aws-invoice-june.pdf
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        1.2 MB
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-primary text-sm">Attached</span>
                      <button
                        aria-label="Receipt options"
                        className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                      >
                        <MoreHorizontal className="size-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="shadow-xs rounded-lg border-border mt-6">
              <CardHeader>
                <CardTitle>Suggested matches</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-md bg-card border border-border flex p-4 justify-between items-center">
                  <span className="text-sm">
                    AWS India · ₹42,180 · 23 Jun 2024
                  </span>
                  <Button onClick={() => router.push('/reconciliation')}>
                    Match this transaction
                  </Button>
                </div>
              </CardContent>
            </Card>
            <p className="text-muted-foreground text-xs mt-8">
              Sample expense · not connected to a live account
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}


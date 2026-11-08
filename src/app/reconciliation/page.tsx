'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Reconciliation() {
  const router = useRouter();
  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground w-full h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <div className="bg-background text-foreground min-h-screen">
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
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                onClick={() => router.push('/transactions')}
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
                className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
                <span className="text-muted-foreground">Banking</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="font-medium text-foreground">
                  Reconciliation
                </span>
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
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-semibold text-2xl tracking-tight">
                    Reconciliation
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Match your books to the bank statement.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select value="ICICI Current Account">
                    <SelectTrigger className="w-56">
                      <SelectValue placeholder="Select Account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ICICI Current Account">
                        ICICI Current Account
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value="June 2024">
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="June 2024">June 2024</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => router.push('/banking')}>
                    Finish review
                  </Button>
                </div>
              </div>
              <div className="rounded-md bg-primary/10 text-primary text-sm border border-primary/30 hidden mt-6 px-4 py-3 items-center gap-3">
                <CheckCircle2 className="size-4" />
                <span>Transaction matched successfully.</span>
              </div>
              <div className="grid mt-8 gap-6 grid-cols-5">
                <Card className="col-span-2 overflow-hidden">
                  <div className="border-t border-r border-b border-b-border border-l-border px-5 py-4">
                    <h2 className="font-medium">12 transactions need review</h2>
                  </div>
                  <div className="flex flex-col">
                    <button className="text-left border-t border-r border-b border-b-border border-l-border flex px-5 py-4 flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">AWS India</span>
                        <span className="font-medium text-sm">-₹42,180</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-xs">
                          23 Jun 2024
                        </span>
                        <span className="rounded-sm bg-muted text-muted-foreground text-xs px-2 py-0.5">
                          Needs review
                        </span>
                      </div>
                    </button>
                    <button className="text-left border-t border-r border-b border-b-border border-l-border flex px-5 py-4 flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">
                          WeWork India
                        </span>
                        <span className="font-medium text-sm">-₹14,220</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-xs">
                          21 Jun 2024
                        </span>
                        <span className="rounded-sm bg-muted text-muted-foreground text-xs px-2 py-0.5">
                          Needs review
                        </span>
                      </div>
                    </button>
                    <button className="text-left border-t border-r border-b border-b-border border-l-border flex px-5 py-4 flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">
                          Bank charges
                        </span>
                        <span className="font-medium text-sm">-₹1,180</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-xs">
                          18 Jun 2024
                        </span>
                        <span className="rounded-sm bg-muted text-muted-foreground text-xs px-2 py-0.5">
                          Needs review
                        </span>
                      </div>
                    </button>
                    <button className="text-left flex px-5 py-4 flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm">UPI refund</span>
                        <span className="font-medium text-sm">-₹12,300</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-xs">
                          14 Jun 2024
                        </span>
                        <span className="rounded-sm bg-muted text-muted-foreground text-xs px-2 py-0.5">
                          Needs review
                        </span>
                      </div>
                    </button>
                  </div>
                </Card>
                <Card className="p-6 col-span-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-semibold text-lg">AWS India</h2>
                      <p className="font-semibold text-2xl mt-1">-₹42,180</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground text-xs">Bank date</p>
                      <p className="font-medium text-sm mt-1">23 Jun 2024</p>
                    </div>
                  </div>
                  <div className="mt-8">
                    <h3 className="font-medium text-sm">Suggested match</h3>
                    <div className="rounded-md bg-muted/40 border border-border mt-3 p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{`Software & subscriptions`}</p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Invoice EXP-2024-0062
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-sm">-₹42,180</p>
                          <p className="text-primary text-xs mt-1">
                            98% confidence
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex mt-4 gap-3">
                      <Button>Match transaction</Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/expense-capture')}
                      >
                        Create new expense
                      </Button>
                    </div>
                  </div>
                  <div className="border-x border-t border-b mt-8 pt-6">
                    <h3 className="font-medium text-sm">Split or categorize</h3>
                    <div className="grid mt-4 gap-4 grid-cols-2">
                      <label className="text-sm flex flex-col gap-2">
                        <span className="text-muted-foreground">Category</span>
                        <Select defaultValue="Software & subscriptions">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Software & subscriptions">{`Software & subscriptions`}</SelectItem>
                            <SelectItem value="Office expenses">
                              Office expenses
                            </SelectItem>
                            <SelectItem value="Travel">Travel</SelectItem>
                          </SelectContent>
                        </Select>
                      </label>
                      <label className="text-sm flex flex-col gap-2">
                        <span className="text-muted-foreground">Memo</span>
                        <input
                          defaultValue="Cloud hosting — June"
                          className="ring-offset-background rounded-md bg-background text-sm border border-input outline-none px-3 h-10 placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        />
                      </label>
                    </div>
                    <label className="text-sm flex mt-4 items-center gap-2">
                      <Checkbox defaultChecked={false} />
                      <span>Exclude from GST</span>
                    </label>
                  </div>
                </Card>
              </div>
              <div className="rounded-md bg-muted text-muted-foreground text-sm border border-border flex mt-6 px-4 py-3 items-center gap-3">
                <AlertCircle className="size-4" />
                <span>4 transactions have incomplete GST data</span>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}


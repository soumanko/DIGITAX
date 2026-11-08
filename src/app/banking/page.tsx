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
  Users,
  Wallet,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function Banking() {
  const router = useRouter();
  return (
    <div data-appearance="light">
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
              <span className="font-medium text-foreground">Banking</span>
            </div>
            <div className="flex items-center gap-4">
              <label className="rounded-md bg-card border border-border flex px-3 items-center gap-2 w-64 h-9">
                <Search className="text-muted-foreground size-4" />
                <input
                  type="search"
                  placeholder="Search"
                  defaultValue=""
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
                  Banking
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Connect accounts and keep your books in sync.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline">Upload statement</Button>
                <Button>Connect account</Button>
              </div>
            </div>
            <div className="grid mt-8 gap-6 grid-cols-5">
              <Card className="col-span-3">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="mb-0">Connected accounts</CardTitle>
                  <Badge variant="secondary">3 accounts</Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="border-x border-t border-b flex px-6 py-5 items-center gap-4">
                    <div className="rounded-md bg-accent text-accent-foreground flex justify-center items-center size-10">
                      <Building2 className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        ICICI Current Account
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        •••• 4821 · synced 10 min ago
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₹6,42,180</p>
                      <Badge className="bg-primary/10 text-primary mt-1">
                        Connected
                      </Badge>
                    </div>
                    <button
                      aria-label="More options for ICICI Current Account"
                      className="rounded-md text-muted-foreground p-2 hover:bg-accent hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>
                  <div className="border-x border-t border-b flex px-6 py-5 items-center gap-4">
                    <div className="rounded-md bg-accent text-accent-foreground flex justify-center items-center size-10">
                      <Building2 className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        HDFC Current Account
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        •••• 9044 · synced 1 hour ago
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₹3,26,230</p>
                      <Badge className="bg-primary/10 text-primary mt-1">
                        Connected
                      </Badge>
                    </div>
                    <button
                      aria-label="More options for HDFC Current Account"
                      className="rounded-md text-muted-foreground p-2 hover:bg-accent hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>
                  <div className="border-x border-t border-b flex px-6 py-5 items-center gap-4">
                    <div className="rounded-md bg-muted text-muted-foreground flex justify-center items-center size-10">
                      <Wallet className="size-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">Cash on hand</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Manual ledger · updated today
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">₹18,600</p>
                      <Badge variant="secondary" className="mt-1">
                        Manual
                      </Badge>
                    </div>
                    <button
                      aria-label="More options for Cash on hand"
                      className="rounded-md text-muted-foreground p-2 hover:bg-accent hover:text-foreground"
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Reconciliation health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-3">
                    <span className="font-semibold text-5xl tracking-tight">
                      94%
                    </span>
                    <span className="text-muted-foreground text-sm pb-2">
                      232 of 248 transactions matched
                    </span>
                  </div>
                  <div className="rounded-full bg-muted mt-6 w-full h-2 overflow-hidden">
                    <div className="rounded-full bg-primary w-11/12 h-full" />
                  </div>
                  <div className="grid mt-6 gap-4 grid-cols-3">
                    <div>
                      <p className="font-semibold text-2xl">232</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Matched
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-2xl">12</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Needs review
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-2xl">4</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        Uncategorised
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="mt-7 w-full"
                    onClick={() => router.push('/reconciliation')}
                  >
                    Review exceptions
                  </Button>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="mb-0">Recent bank activity</CardTitle>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All accounts</SelectItem>
                    <SelectItem value="icici">
                      ICICI Current Account
                    </SelectItem>
                    <SelectItem value="hdfc">HDFC Current Account</SelectItem>
                    <SelectItem value="cash">Cash on hand</SelectItem>
                  </SelectContent>
                </Select>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border border-border overflow-hidden">
                  <table className="text-sm w-full">
                    <thead>
                      <tr className="text-left bg-muted text-muted-foreground text-xs">
                        <th className="font-medium px-4 py-3">Date</th>
                        <th className="font-medium px-4 py-3">Account</th>
                        <th className="font-medium px-4 py-3">Description</th>
                        <th className="font-medium text-right px-4 py-3">
                          Amount
                        </th>
                        <th className="font-medium px-4 py-3">
                          Match status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-x border-t border-b">
                        <td className="text-muted-foreground px-4 py-3">
                          18 Jun 2024
                        </td>
                        <td className="px-4 py-3">ICICI Current Account</td>
                        <td className="px-4 py-3">Razorpay settlement</td>
                        <td className="font-medium text-right text-primary px-4 py-3">
                          +₹86,400
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-primary/10 text-primary">
                            Matched
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-x border-t border-b">
                        <td className="text-muted-foreground px-4 py-3">
                          18 Jun 2024
                        </td>
                        <td className="px-4 py-3">HDFC Current Account</td>
                        <td className="px-4 py-3">AWS India</td>
                        <td className="font-medium text-right px-4 py-3">
                          -₹42,180
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">Needs review</Badge>
                        </td>
                      </tr>
                      <tr className="border-x border-t border-b">
                        <td className="text-muted-foreground px-4 py-3">
                          17 Jun 2024
                        </td>
                        <td className="px-4 py-3">ICICI Current Account</td>
                        <td className="px-4 py-3">NEFT from Aster Labs</td>
                        <td className="font-medium text-right text-primary px-4 py-3">
                          +₹2,50,000
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-primary/10 text-primary">
                            Matched
                          </Badge>
                        </td>
                      </tr>
                      <tr className="border-x border-t border-b">
                        <td className="text-muted-foreground px-4 py-3">
                          17 Jun 2024
                        </td>
                        <td className="px-4 py-3">HDFC Current Account</td>
                        <td className="px-4 py-3">Bank charges</td>
                        <td className="font-medium text-right px-4 py-3">
                          -₹1,180
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary">Categorized</Badge>
                        </td>
                      </tr>
                      <tr className="border-x border-t border-b">
                        <td className="text-muted-foreground px-4 py-3">
                          16 Jun 2024
                        </td>
                        <td className="px-4 py-3">ICICI Current Account</td>
                        <td className="px-4 py-3">UPI refund</td>
                        <td className="font-medium text-right px-4 py-3">
                          -₹12,300
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">Needs review</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="rounded-md text-muted-foreground text-sm border border-dashed border-border flex mt-6 justify-center items-center h-20">
                  Drop a CSV or bank statement here to import
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}


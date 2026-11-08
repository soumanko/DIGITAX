'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpFromLine,
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
  RotateCcw,
  Search,
  SearchX,
  Settings,
  SlidersHorizontal,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function Transactions() {
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
            <Link
              href="/dashboard"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </Link>
            <Link
              href="/transactions"
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
            >
              <ArrowLeftRight className="size-4" />
              <span>Transactions</span>
            </Link>
            <Link
              href="/gst"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <ReceiptText className="size-4" />
              <span>{`GST & Tax`}</span>
            </Link>
            <Link
              href="/banking"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Landmark className="size-4" />
              <span>Banking</span>
            </Link>
            <Link
              href="/reports"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <BarChart3 className="size-4" />
              <span>Reports</span>
            </Link>
            <Link
              href="/contacts"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Users className="size-4" />
              <span>Contacts</span>
            </Link>
            <Link
              href="/settings"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Settings className="size-4" />
              <span>Settings</span>
            </Link>
          </nav>
          <div className="border-x border-t border-b flex pt-4 flex-col gap-2">
            <Link
              href="/dashboard"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <CircleHelp className="size-4" />
              <span>{`Help & support`}</span>
            </Link>
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
              <span className="font-medium text-foreground">
                Transactions
              </span>
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
                  Transactions
                </h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Review, categorize, and reconcile every business movement.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  className="h-9"
                  onClick={() => router.push('/expense-capture')}
                >
                  Add transaction
                </Button>
                <Button variant="secondary" className="h-9">
                  Import
                </Button>
              </div>
            </div>
            <div className="rounded-md bg-card border border-border flex mt-8 p-3 items-center gap-3">
              <label className="rounded-md bg-background border border-input flex px-3 items-center gap-2 h-9 min-w-72">
                <Search className="text-muted-foreground size-4" />
                <input
                  type="search"
                  placeholder="Search by merchant or amount"
                  defaultValue=""
                  className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                />
              </label>
              <Select defaultValue="all">
                <SelectTrigger className="w-48 h-9">
                  <SelectValue placeholder="All accounts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All accounts</SelectItem>
                  <SelectItem value="icici">ICICI Current Account</SelectItem>
                  <SelectItem value="hdfc">HDFC Current Account</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-44 h-9">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="software">{`Software & subscriptions`}</SelectItem>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="taxes">Taxes</SelectItem>
                  <SelectItem value="refunds">Refunds</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="jun-2024">
                <SelectTrigger className="w-36 h-9">
                  <SelectValue placeholder="Jun 2024" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jun-2024">Jun 2024</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="secondary" className="ml-auto gap-2 h-9">
                <SlidersHorizontal className="size-4" />
                Filters
              </Button>
            </div>
            <Card className="mt-6 overflow-hidden">
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Account</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="text-sm">24 Jun</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span
                            className="rounded-md bg-primary/10 text-primary flex justify-center items-center size-8"
                            onClick={() => router.push('/invoice-details')}
                          >
                            <ArrowDownToLine className="size-4" />
                          </span>
                          <span className="font-medium">
                            Razorpay settlement
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>Sales</TableCell>
                      <TableCell>HDFC Current</TableCell>
                      <TableCell className="font-medium text-right text-primary">
                        +₹86,400
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary">
                          Matched
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          aria-label="More options"
                          className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">23 Jun</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="rounded-md bg-muted text-muted-foreground flex justify-center items-center size-8">
                            <ArrowUpFromLine className="size-4" />
                          </span>
                          <span
                            className="font-medium"
                            onClick={() => router.push('/expense-capture')}
                          >
                            AWS India
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{`Software & subscriptions`}</TableCell>
                      <TableCell>ICICI Current</TableCell>
                      <TableCell className="font-medium text-right">
                        -₹42,180
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-destructive border-destructive/50"
                        >
                          Needs review
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          aria-label="More options"
                          className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">21 Jun</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="rounded-md bg-muted text-muted-foreground flex justify-center items-center size-8">
                            <ArrowUpFromLine className="size-4" />
                          </span>
                          <span
                            className="font-medium"
                            onClick={() => router.push('/invoice-details')}
                          >
                            Office lease
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>Rent</TableCell>
                      <TableCell>ICICI Current</TableCell>
                      <TableCell className="font-medium text-right">
                        -₹1,20,000
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary">
                          Matched
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          aria-label="More options"
                          className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">20 Jun</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="rounded-md bg-muted text-muted-foreground flex justify-center items-center size-8">
                            <ArrowUpFromLine className="size-4" />
                          </span>
                          <span className="font-medium">TDS payment</span>
                        </div>
                      </TableCell>
                      <TableCell>Taxes</TableCell>
                      <TableCell>ICICI Current</TableCell>
                      <TableCell className="font-medium text-right">
                        -₹18,500
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-primary/10 text-primary">
                          Matched
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          aria-label="More options"
                          className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">19 Jun</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="rounded-md bg-muted text-muted-foreground flex justify-center items-center size-8">
                            <ArrowUpFromLine className="size-4" />
                          </span>
                          <span className="font-medium">
                            Zoho Corporation
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{`Software & subscriptions`}</TableCell>
                      <TableCell>HDFC Current</TableCell>
                      <TableCell className="font-medium text-right">
                        -₹8,400
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-destructive border-destructive/50"
                        >
                          Needs review
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          aria-label="More options"
                          className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-sm">18 Jun</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <span className="rounded-md bg-primary/10 text-primary flex justify-center items-center size-8">
                            <RotateCcw className="size-4" />
                          </span>
                          <span
                            className="font-medium"
                            onClick={() => router.push('/invoice-details')}
                          >
                            Client refund
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>Refunds</TableCell>
                      <TableCell>ICICI Current</TableCell>
                      <TableCell className="font-medium text-right">
                        -₹12,300
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-accent text-accent-foreground">
                          Categorized
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <button
                          aria-label="More options"
                          className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                        >
                          <MoreHorizontal className="size-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                <div className="border-x border-t border-b flex px-6 py-4 justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    Showing 1–6 of 248 transactions
                  </span>
                  <div className="flex items-center gap-1">
                    <Button className="p-0 size-8">1</Button>
                    <Button className="p-0 size-8">2</Button>
                    <Button className="p-0 size-8">3</Button>
                    <Button variant="ghost" className="px-3 gap-1 h-8">
                      Next
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                  <span className="text-muted-foreground text-xs">
                    Sample data
                  </span>
                </div>
              </div>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}

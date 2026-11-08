'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  Check,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Download,
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function InvoiceDetails() {
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
            >
              <ReceiptText className="size-4" />
              <span>{`GST & Tax`}</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Landmark className="size-4" />
              <span>Banking</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <BarChart3 className="size-4" />
              <span>Reports</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <Users className="size-4" />
              <span>Contacts</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
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
              <span className="font-medium text-foreground">INV-2024-0186</span>
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
            <div className="flex mb-6 justify-between items-end">
              <div>
                <a
                  href="#"
                  className="text-muted-foreground text-sm inline-flex mb-3 items-center gap-2 hover:text-foreground"
                  onClick={() => router.push('/transactions')}
                >
                  <ArrowLeft className="size-4" />
                  <span>Back to transactions</span>
                </a>
                <div className="flex items-center gap-3">
                  <h1 className="font-semibold text-2xl tracking-tight">
                    Invoice INV-2024-0186
                  </h1>
                  <Badge className="bg-primary/10 text-primary">Paid</Badge>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline">
                  <Download className="mr-2 size-4" />
                  Download PDF
                </Button>
                <Button>Record payment</Button>
              </div>
            </div>
            <div className="grid items-start gap-6 grid-cols-3">
              <Card className="col-span-2">
                <CardHeader className="border-t border-r border-b border-b-border border-l-border">
                  <CardTitle>Invoice from</CardTitle>
                  <CardDescription>Invoice INV-2024-0186</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="border-t border-r border-b border-b-border border-l-border grid pb-6 gap-6 grid-cols-2">
                    <div>
                      <p className="font-semibold text-lg">
                        Tata Communications Ltd.
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        GSTIN 27AAACT1234F1Z7
                      </p>
                      <p className="text-muted-foreground text-sm mt-3">
                        Vikhroli West, Mumbai, Maharashtra 400079
                      </p>
                    </div>
                    <div className="text-sm grid gap-4 grid-cols-2">
                      <div>
                        <p className="text-muted-foreground">Invoice date</p>
                        <p className="font-medium mt-1">21 Jun 2024</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Due date</p>
                        <p className="font-medium mt-1">21 Jul 2024</p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-md border border-border mt-6 overflow-hidden">
                    <table className="text-sm w-full">
                      <thead className="bg-muted text-muted-foreground">
                        <tr>
                          <th className="font-medium text-left px-4 py-3">
                            Description
                          </th>
                          <th className="font-medium text-right px-4 py-3">
                            Qty
                          </th>
                          <th className="font-medium text-right px-4 py-3">
                            Rate
                          </th>
                          <th className="font-medium text-right px-4 py-3">
                            Tax
                          </th>
                          <th className="font-medium text-right px-4 py-3">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-x border-t border-b">
                          <td className="font-medium p-4">
                            Dedicated internet line
                          </td>
                          <td className="text-right p-4">1</td>
                          <td className="text-right p-4">₹20,000</td>
                          <td className="text-right p-4">18%</td>
                          <td className="font-medium text-right p-4">
                            ₹23,600
                          </td>
                        </tr>
                        <tr className="border-x border-t border-b">
                          <td className="font-medium p-4">Managed router</td>
                          <td className="text-right p-4">1</td>
                          <td className="text-right p-4">₹650</td>
                          <td className="text-right p-4">18%</td>
                          <td className="font-medium text-right p-4">₹767</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-sm mt-6 ml-auto max-w-xs">
                    <div className="flex mb-3 justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹20,650</span>
                    </div>
                    <div className="flex mb-3 justify-between">
                      <span className="text-muted-foreground">CGST</span>
                      <span>₹1,858</span>
                    </div>
                    <div className="flex mb-3 justify-between">
                      <span className="text-muted-foreground">SGST</span>
                      <span>₹1,858</span>
                    </div>
                    <div className="font-semibold text-base border-x border-t border-b flex pt-3 justify-between">
                      <span>Total</span>
                      <span>₹24,366</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="border-t border-r border-b border-b-border border-l-border">
                  <CardTitle>Payment status</CardTitle>
                  <CardDescription>Payment completed</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="rounded-md bg-muted p-4">
                    <p className="text-muted-foreground text-sm">Paid amount</p>
                    <p className="font-semibold text-2xl mt-1">₹24,366</p>
                    <p className="text-muted-foreground text-sm mt-2">
                      Paid on 22 Jun 2024
                    </p>
                    <p className="font-medium text-sm mt-1">
                      ICICI Current Account
                    </p>
                  </div>
                  <div className="mt-6">
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="rounded-full bg-primary text-primary-foreground flex justify-center items-center size-6">
                          <Check className="size-4" />
                        </span>
                        <span className="bg-primary w-px h-10" />
                      </div>
                      <div className="pb-6">
                        <p className="font-medium text-sm">Invoice received</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          21 Jun 2024
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className="rounded-full bg-primary text-primary-foreground flex justify-center items-center size-6">
                          <Check className="size-4" />
                        </span>
                        <span className="bg-primary w-px h-10" />
                      </div>
                      <div className="pb-6">
                        <p className="font-medium text-sm">Matched to bank</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          22 Jun 2024
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="rounded-full bg-primary text-primary-foreground flex justify-center items-center size-6">
                        <Check className="size-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">Payment recorded</p>
                        <p className="text-muted-foreground text-xs mt-1">
                          22 Jun 2024
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6">
              <CardHeader className="border-t border-r border-b border-b-border border-l-border">
                <CardTitle>Activity</CardTitle>
                <CardDescription>
                  Notes and updates for this invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex gap-3">
                    <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8" />
                    <div>
                      <p className="font-medium text-sm">Ananya Kapoor</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Invoice matched with the purchase order and approved for
                        payment.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8" />
                    <div>
                      <p className="font-medium text-sm">Arjun Mehta</p>
                      <p className="text-muted-foreground text-sm mt-1">
                        Payment confirmation received from the ICICI current
                        account.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="border-x border-t border-b flex mt-6 pt-5 items-center gap-3">
                  <Input placeholder="Add a note..." defaultValue="" />
                  <Button>Post note</Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}


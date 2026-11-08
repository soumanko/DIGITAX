'use client';

import React from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  ChevronRight,
  ChevronsUpDown,
  CircleHelp,
  Info,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  TriangleAlert,
  Users,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function GSTReturnFiling() {
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
              >
                <LayoutDashboard className="size-4" />
                <span>Overview</span>
              </a>
              <a
                href="#"
                className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              >
                <ArrowLeftRight className="size-4" />
                <span>Transactions</span>
              </a>
              <a
                href="#"
                className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
                <span className="text-muted-foreground">{`GST & Tax`}</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="font-medium text-foreground">GSTR-3B</span>
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
                  <div className="flex items-center gap-3">
                    <h1 className="font-semibold text-2xl">
                      GSTR-3B · June 2024
                    </h1>
                    <Badge variant="secondary">Draft</Badge>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">
                    Review figures before filing your monthly return.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline">Save draft</Button>
                  <Button>Mark ready to file</Button>
                </div>
              </div>
              <Tabs defaultValue="prepare" className="mt-8">
                <TabsList className="grid grid-cols-3 w-full max-w-xl">
                  <TabsTrigger value="prepare">Prepare</TabsTrigger>
                  <TabsTrigger value="review">Review</TabsTrigger>
                  <TabsTrigger value="file">File</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="grid mt-6 gap-6 grid-cols-3">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Tax summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        Outward taxable supplies
                        <Info className="text-muted-foreground size-4" />
                      </span>
                      <span className="font-medium text-sm">₹26,49,000</span>
                    </div>
                    <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        Integrated tax
                        <Info className="text-muted-foreground size-4" />
                      </span>
                      <span className="font-medium text-sm">₹0</span>
                    </div>
                    <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        Central tax
                        <Info className="text-muted-foreground size-4" />
                      </span>
                      <span className="font-medium text-sm">₹2,38,410</span>
                    </div>
                    <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        State tax
                        <Info className="text-muted-foreground size-4" />
                      </span>
                      <span className="font-medium text-sm">₹2,38,410</span>
                    </div>
                    <div className="border-t border-r border-b border-b-border border-l-border flex mb-1 py-3 justify-between items-center">
                      <span className="text-sm flex items-center gap-2">
                        Eligible ITC
                        <Info className="text-muted-foreground size-4" />
                      </span>
                      <span className="font-medium text-sm">-₹1,92,060</span>
                    </div>
                    <div className="flex pt-4 justify-between items-center">
                      <span className="font-semibold text-sm">
                        Net tax payable
                      </span>
                      <span className="font-semibold text-primary text-base">
                        ₹2,84,760
                      </span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Return checks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <label className="flex mb-4 items-center gap-3">
                      <Checkbox defaultChecked={true} />
                      <span className="text-sm flex-1">
                        Sales invoices reconciled
                      </span>
                      <Badge variant="secondary">Complete</Badge>
                    </label>
                    <label className="flex mb-4 items-center gap-3">
                      <Checkbox defaultChecked={true} />
                      <span className="text-sm flex-1">
                        Purchase ITC matched
                      </span>
                      <Badge variant="secondary">Complete</Badge>
                    </label>
                    <label className="flex mb-4 items-center gap-3">
                      <Checkbox defaultChecked={false} />
                      <span className="text-sm flex-1">
                        Reverse charge reviewed
                      </span>
                      <Badge variant="outline">Incomplete</Badge>
                    </label>
                    <label className="flex mb-4 items-center gap-3">
                      <Checkbox defaultChecked={true} />
                      <span className="text-sm flex-1">
                        Bank payments linked
                      </span>
                      <Badge variant="secondary">Complete</Badge>
                    </label>
                    <label className="flex mb-4 items-center gap-3">
                      <Checkbox defaultChecked={false} />
                      <span className="text-sm flex-1">
                        Filing period locked
                      </span>
                      <Badge variant="outline">Incomplete</Badge>
                    </label>
                    <Button className="mt-2 w-full">Resolve issues</Button>
                  </CardContent>
                </Card>
              </div>
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Source transactions</CardTitle>
                  <CardDescription>
                    Sample data from the June 2024 filing period.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Transaction</TableHead>
                        <TableHead>Party</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">
                          Taxable value
                        </TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-xs">
                          INV-240601
                        </TableCell>
                        <TableCell>Nova Retail Pvt. Ltd.</TableCell>
                        <TableCell>01 Jun 2024</TableCell>
                        <TableCell className="text-right">₹8,40,000</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Reconciled</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">
                          INV-240614
                        </TableCell>
                        <TableCell>Meridian Systems</TableCell>
                        <TableCell>14 Jun 2024</TableCell>
                        <TableCell className="text-right">₹5,25,000</TableCell>
                        <TableCell>
                          <Badge variant="secondary">Reconciled</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">
                          BILL-240622
                        </TableCell>
                        <TableCell>Cloudline Services</TableCell>
                        <TableCell>22 Jun 2024</TableCell>
                        <TableCell className="text-right">₹3,80,000</TableCell>
                        <TableCell>
                          <Badge variant="secondary">ITC matched</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">
                          INV-240628
                        </TableCell>
                        <TableCell>Eastwood Distribution</TableCell>
                        <TableCell>28 Jun 2024</TableCell>
                        <TableCell className="text-right">₹6,10,000</TableCell>
                        <TableCell>
                          <Badge variant="outline">Needs review</Badge>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-mono text-xs">
                          BILL-240630
                        </TableCell>
                        <TableCell>Vertex Logistics</TableCell>
                        <TableCell>30 Jun 2024</TableCell>
                        <TableCell className="text-right">₹2,94,000</TableCell>
                        <TableCell>
                          <Badge variant="outline">Needs review</Badge>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
                <CardFooter className="border-x border-t border-b">
                  <div className="text-muted-foreground text-sm flex items-center gap-2">
                    <TriangleAlert className="text-destructive size-4" />2
                    checks need attention before this return can be filed.
                  </div>
                </CardFooter>
              </Card>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

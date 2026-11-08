'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer } from '@/components/ui/chart';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pie, PieChart as RechartsPieChart } from 'recharts';

export default function GSTTax() {
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
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
              <span className="font-medium text-foreground">{`GST & Tax`}</span>
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
          <main className="px-8 pt-24 pb-10">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="font-semibold text-2xl tracking-tight">{`GST & Tax`}</h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Stay ahead of registrations, returns, and input credits.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select defaultValue="FY 2024–25">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FY 2024–25">FY 2024–25</SelectItem>
                    <SelectItem value="FY 2023–24">FY 2023–24</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => router.push('/gst-return-filing')}>
                  Prepare return
                </Button>
              </div>
            </div>
            <div className="grid mt-8 gap-4 grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-muted-foreground text-sm">Output tax</p>
                  <p className="font-semibold text-xl mt-3">₹4,76,820</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-muted-foreground text-sm">
                    Input credit
                  </p>
                  <p className="font-semibold text-xl mt-3">₹1,92,060</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-muted-foreground text-sm">Net payable</p>
                  <p className="font-semibold text-xl mt-3">₹2,84,760</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-muted-foreground text-sm">
                    Filing health
                  </p>
                  <div className="flex mt-3 justify-between items-end">
                    <p className="font-semibold text-xl">86%</p>
                    <span className="font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1">
                      Good standing
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid mt-6 gap-6 grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Return calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="Jun">
                    <TabsList className="grid grid-cols-5 w-full">
                      <TabsTrigger value="Apr">Apr</TabsTrigger>
                      <TabsTrigger value="May">May</TabsTrigger>
                      <TabsTrigger value="Jun">Jun</TabsTrigger>
                      <TabsTrigger value="Jul">Jul</TabsTrigger>
                      <TabsTrigger value="Aug">Aug</TabsTrigger>
                    </TabsList>
                    <TabsContent value="Jun" className="mt-5">
                      <div className="flex flex-col gap-3">
                        <div className="rounded-md border border-border flex p-4 justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">GSTR-1</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              Due 11 Jul 2024
                            </p>
                          </div>
                          <span className="font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1">
                            Ready to file
                          </span>
                        </div>
                        <div className="rounded-md border border-border flex p-4 justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">GSTR-3B</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              Due 20 Jul 2024
                            </p>
                          </div>
                          <span className="font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1">
                            In progress
                          </span>
                        </div>
                        <div className="rounded-md border border-border flex p-4 justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">TDS return</p>
                            <p className="text-muted-foreground text-xs mt-1">
                              Due 31 Jul 2024
                            </p>
                          </div>
                          <span className="font-medium rounded-md bg-muted text-muted-foreground text-xs px-2 py-1">
                            Upcoming
                          </span>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>GST overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      output: {
                        label: "Output tax",
                        color: "var(--color-chart-1)",
                      },
                      input: {
                        label: "Input tax credit",
                        color: "var(--color-chart-2)",
                      },
                      net: {
                        label: "Net payable",
                        color: "var(--color-chart-3)",
                      },
                    }}
                    className="mx-auto w-full h-48"
                  >
                    <RechartsPieChart>
                      <Pie
                        data={[
                          {
                            name: "Output tax",
                            value: 476820,
                            fill: "var(--color-chart-1)",
                          },
                          {
                            name: "Input tax credit",
                            value: 192060,
                            fill: "var(--color-chart-2)",
                          },
                          {
                            name: "Net payable",
                            value: 284760,
                            fill: "var(--color-chart-3)",
                          },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={52}
                        outerRadius={76}
                      />
                    </RechartsPieChart>
                  </ChartContainer>
                  <div className="text-muted-foreground text-xs flex mt-3 justify-center gap-4">
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-chart-1 size-2" />
                      Output tax
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-chart-2 size-2" />
                      Input tax credit
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-chart-3 size-2" />
                      Net payable
                    </span>
                  </div>
                  <div className="border-x border-t border-b mt-6 pt-4">
                    <span className="font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1">
                      Active · Regular
                    </span>
                    <p className="font-mono text-sm mt-3">27AABCU9603R1ZV</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card className="mt-6">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle>Input tax credit</CardTitle>
                <Button
                  variant="outline"
                  onClick={() => router.push('/transactions')}
                >
                  Review unmatched invoices
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Tata Communications</TableCell>
                      <TableCell>₹24,380</TableCell>
                      <TableCell>
                        <span className="text-primary text-sm">Eligible</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>AWS India</TableCell>
                      <TableCell>₹8,436</TableCell>
                      <TableCell>
                        <span className="text-primary text-sm">Eligible</span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>WeWork India</TableCell>
                      <TableCell>₹14,220</TableCell>
                      <TableCell>
                        <span className="text-muted-foreground text-sm">
                          Pending invoice
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}


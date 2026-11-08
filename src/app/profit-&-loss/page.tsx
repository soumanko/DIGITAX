'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowLeftRight,
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
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
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  XAxis,
  YAxis,
} from 'recharts';

export default function ProfitLoss() {
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
            <Link
              href="/dashboard"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </Link>
            <Link
              href="/transactions"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
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
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
              <span className="text-muted-foreground">Reports</span>
              <ChevronRight className="text-muted-foreground size-4" />
              <span className="font-medium text-foreground">{`Profit & Loss`}</span>
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
          <main className="px-8 pt-24 pb-10">
            <div className="flex mb-6 justify-between items-start">
              <div>
                <div className="flex mb-2 items-center gap-3">
                  <h1 className="font-semibold text-2xl tracking-tight">{`Profit & Loss`}</h1>
                  <span className="rounded-sm bg-muted text-muted-foreground text-xs px-2 py-1">
                    Sample data
                  </span>
                </div>
                <p className="text-muted-foreground text-sm">
                  A clear view of performance for the quarter.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select defaultValue="Apr–Jun 2024">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apr–Jun 2024">Apr–Jun 2024</SelectItem>
                    <SelectItem value="Jan–Mar 2024">Jan–Mar 2024</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="Previous quarter">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Previous quarter">
                      Previous quarter
                    </SelectItem>
                    <SelectItem value="Previous year">Previous year</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => router.push('/reports')}>
                  <Download className="mr-2 size-4" />
                  Export PDF
                </Button>
              </div>
            </div>
            <div className="grid mb-6 gap-4 grid-cols-4">
              <Card className="p-5">
                <p className="text-muted-foreground text-sm">Revenue</p>
                <p className="font-semibold text-2xl mt-3">₹52,84,200</p>
                <p className="text-primary text-sm mt-2">+18.4%</p>
              </Card>
              <Card className="p-5">
                <p className="text-muted-foreground text-sm">Gross profit</p>
                <p className="font-semibold text-2xl mt-3">₹31,60,740</p>
                <p className="text-muted-foreground text-sm mt-2">
                  59.8% margin
                </p>
              </Card>
              <Card className="p-5">
                <p className="text-muted-foreground text-sm">
                  Operating expenses
                </p>
                <p className="font-semibold text-2xl mt-3">₹18,42,320</p>
                <p className="text-primary text-sm mt-2">-3.2%</p>
              </Card>
              <Card className="p-5">
                <p className="text-muted-foreground text-sm">Net profit</p>
                <p className="font-semibold text-2xl mt-3">₹13,18,420</p>
                <p className="text-muted-foreground text-sm mt-2">
                  24.9% margin
                </p>
              </Card>
            </div>
            <Card className="mb-6 p-6">
              <div className="flex mb-5 justify-between items-center">
                <div>
                  <h2 className="font-semibold text-lg">Performance trend</h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Quarterly performance across revenue and costs
                  </p>
                </div>
                <span className="text-muted-foreground text-xs">
                  Sample data
                </span>
              </div>
              <ChartContainer
                config={{
                  revenue: { label: "Revenue", color: "var(--color-chart-1)" },
                  expenses: {
                    label: "Expenses",
                    color: "var(--color-chart-2)",
                  },
                  netProfit: {
                    label: "Net profit",
                    color: "var(--color-chart-3)",
                  },
                }}
                className="w-full h-64"
              >
                <RechartsLineChart
                  data={[
                    {
                      month: "Apr",
                      revenue: 1620000,
                      expenses: 640000,
                      netProfit: 980000,
                    },
                    {
                      month: "May",
                      revenue: 1748200,
                      expenses: 702320,
                      netProfit: 1045880,
                    },
                    {
                      month: "Jun",
                      revenue: 1916000,
                      expenses: 830000,
                      netProfit: 1127780,
                    },
                  ]}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <ChartTooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-chart-1)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="var(--color-chart-2)"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="netProfit"
                    stroke="var(--color-chart-3)"
                    strokeWidth={2}
                    dot={false}
                  />
                </RechartsLineChart>
              </ChartContainer>
              <div className="text-sm flex mt-5 items-center gap-6">
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-chart-1 size-2" />
                  Revenue
                </span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-chart-2 size-2" />
                  Expenses
                </span>
                <span className="flex items-center gap-2">
                  <span className="rounded-full bg-chart-3 size-2" />
                  Net profit
                </span>
              </div>
              <p className="text-muted-foreground text-xs mt-3">
                Sample data shown for Apr–Jun 2024.
              </p>
            </Card>
            <div className="grid gap-6 grid-cols-3">
              <Card className="p-6 col-span-2">
                <div className="flex mb-4 justify-between items-center">
                  <h2 className="font-semibold text-lg">Statement</h2>
                  <span className="text-muted-foreground text-xs">
                    Sample data
                  </span>
                </div>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">
                        <span className="flex items-center gap-2">
                          <ChevronDown className="text-muted-foreground size-4" />
                          Revenue
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-right">
                        ₹52,84,200
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground pl-10">
                        Cost of goods sold
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        -₹21,23,460
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-medium">
                        Gross profit
                      </TableCell>
                      <TableCell className="font-medium text-right">
                        ₹31,60,740
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground pl-10">
                        Operating expenses
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        -₹18,42,320
                      </TableCell>
                    </TableRow>
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-medium">EBITDA</TableCell>
                      <TableCell className="font-medium text-right">
                        ₹13,18,420
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="text-muted-foreground pl-10">
                        Taxes
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        -₹2,84,760
                      </TableCell>
                    </TableRow>
                    <TableRow className="border-t-2">
                      <TableCell className="font-semibold">
                        Net profit
                      </TableCell>
                      <TableCell className="font-semibold text-right">
                        ₹10,33,660
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Card>
              <Card className="p-6">
                <div className="flex mb-6 justify-between items-center">
                  <h2 className="font-semibold text-lg">
                    Top expense categories
                  </h2>
                  <span className="text-muted-foreground text-xs">
                    Sample data
                  </span>
                </div>
                <div className="flex flex-col gap-5">
                  <div>
                    <div className="text-sm flex mb-2 justify-between">
                      <span>Payroll</span>
                      <span className="text-muted-foreground">₹9,45,000</span>
                    </div>
                    <div className="rounded-full bg-muted h-2">
                      <div className="rounded-full bg-chart-1 w-full h-2" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm flex mb-2 justify-between">
                      <span>Rent</span>
                      <span className="text-muted-foreground">₹3,60,000</span>
                    </div>
                    <div className="rounded-full bg-muted h-2">
                      <div className="rounded-full bg-chart-1 w-3/5 h-2" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm flex mb-2 justify-between">
                      <span>Software</span>
                      <span className="text-muted-foreground">₹2,14,680</span>
                    </div>
                    <div className="rounded-full bg-muted h-2">
                      <div className="rounded-full bg-chart-1 w-2/5 h-2" />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm flex mb-2 justify-between">
                      <span>Marketing</span>
                      <span className="text-muted-foreground">₹1,86,400</span>
                    </div>
                    <div className="rounded-full bg-muted h-2">
                      <div className="rounded-full bg-chart-1 w-1/3 h-2" />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


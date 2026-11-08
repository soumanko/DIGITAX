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
  TrendingUp,
  Users,
} from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

export default function ExecutiveOverview() {
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
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
              <span className="font-medium text-foreground">Overview</span>
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
            <div className="mx-auto max-w-7xl">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="font-semibold text-foreground text-2xl tracking-tight">
                    Good morning, Ananya
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    Here&rsquo;s your business snapshot for 24 Jun 2024.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Select defaultValue="This month">
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="This month">This month</SelectItem>
                      <SelectItem value="Last month">Last month</SelectItem>
                      <SelectItem value="This quarter">This quarter</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={() => router.push('/expense-capture')}>
                    Add transaction
                  </Button>
                </div>
              </div>
              <div className="grid mt-8 gap-4 grid-cols-4">
                <Card className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">
                      Total revenue
                    </span>
                    <TrendingUp className="text-primary size-4" />
                  </div>
                  <div className="font-semibold text-2xl tracking-tight mt-4">
                    ₹18,42,600
                  </div>
                  <div className="text-primary text-xs mt-2">
                    +12.8%
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">
                      Total expenses
                    </span>
                  </div>
                  <div className="font-semibold text-2xl tracking-tight mt-4">
                    ₹11,26,340
                  </div>
                  <div className="text-primary text-xs mt-2">
                    -4.2%
                    <span className="text-muted-foreground">vs last month</span>
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">
                      GST payable
                    </span>
                  </div>
                  <div className="font-semibold text-2xl tracking-tight mt-4">
                    ₹2,84,760
                  </div>
                  <div className="text-muted-foreground text-xs mt-2">
                    Due in 6 days
                  </div>
                </Card>
                <Card className="p-5">
                  <div className="flex justify-between items-start">
                    <span className="text-muted-foreground text-sm">
                      Cash balance
                    </span>
                  </div>
                  <div className="font-semibold text-2xl tracking-tight mt-4">
                    ₹9,68,410
                  </div>
                  <div className="text-muted-foreground text-xs mt-2">
                    Updated 10 min ago
                  </div>
                </Card>
              </div>
              <div className="grid mt-6 gap-6 grid-cols-3">
                <Card className="p-6 col-span-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="font-semibold text-base">Cash flow</h2>
                      <p className="text-muted-foreground text-xs mt-1">
                        Revenue and expenses over time
                      </p>
                    </div>
                    <Tabs defaultValue="6 months">
                      <TabsList>
                        <TabsTrigger value="6 months">6 months</TabsTrigger>
                        <TabsTrigger value="12 months">12 months</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <ChartContainer
                    config={{
                      revenue: {
                        label: 'Revenue',
                        color: 'var(--color-chart-1)',
                      },
                      expenses: {
                        label: 'Expenses',
                        color: 'var(--color-chart-2)',
                      },
                    }}
                    className="mt-6 w-full h-64"
                  >
                    <RechartsAreaChart
                      data={[
                        { month: 'Jan', revenue: 248000, expenses: 172000 },
                        { month: 'Feb', revenue: 286000, expenses: 184000 },
                        { month: 'Mar', revenue: 264000, expenses: 193000 },
                        { month: 'Apr', revenue: 318000, expenses: 205000 },
                        { month: 'May', revenue: 342000, expenses: 221000 },
                        { month: 'Jun', revenue: 386000, expenses: 251000 },
                      ]}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        axisLine={false}
                        tickMargin={8}
                      />
                      <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                      <ChartTooltip />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--color-chart-1)"
                        fill="var(--color-chart-1)"
                        fillOpacity={0.16}
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="var(--color-chart-2)"
                        fill="var(--color-chart-2)"
                        fillOpacity={0.08}
                        strokeWidth={2}
                      />
                    </RechartsAreaChart>
                  </ChartContainer>
                </Card>
                <Card className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-semibold text-base">
                        GST filing status
                      </h2>
                      <p className="text-muted-foreground text-xs mt-1">
                        GSTR-3B · June 2024
                      </p>
                    </div>
                    <span className="font-medium rounded-md bg-primary/10 text-primary text-xs px-2 py-1">
                      In progress
                    </span>
                  </div>
                  <div className="flex mt-8 justify-between items-end">
                    <span className="text-muted-foreground text-sm">
                      Completion
                    </span>
                    <span className="font-semibold text-lg">72%</span>
                  </div>
                  <div className="rounded-full bg-muted mt-3 w-full h-2">
                    <div className="rounded-full bg-primary w-[72%] h-2" />
                  </div>
                  <div className="text-sm flex mt-6 justify-between items-center">
                    <span className="text-muted-foreground">Due date</span>
                    <span className="font-medium">20 Jul 2024</span>
                  </div>
                  <Button
                    className="mt-6 w-full"
                    onClick={() => router.push('/gst-return-filing')}
                  >
                    Review return
                  </Button>
                </Card>
              </div>
              <div className="grid mt-6 gap-6 grid-cols-2">
                <Card className="p-6">
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-base">
                      Recent transactions
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => router.push('/transactions')}
                    >
                      View all transactions
                    </Button>
                  </div>
                  <div className="mt-5">
                    <div className="border-t border-r border-b border-b-border border-l-border flex py-3 justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">
                          Razorpay settlement
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">
                          Sales · 24 Jun 2024
                        </div>
                      </div>
                      <span className="font-medium text-sm">₹86,400</span>
                    </div>
                    <div className="border-t border-r border-b border-b-border border-l-border flex py-3 justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">AWS India</div>
                        <div className="text-muted-foreground text-xs mt-1">
                          Software · 22 Jun 2024
                        </div>
                      </div>
                      <span className="font-medium text-sm">₹42,180</span>
                    </div>
                    <div className="border-t border-r border-b border-b-border border-l-border flex py-3 justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">Office lease</div>
                        <div className="text-muted-foreground text-xs mt-1">
                          Rent · 20 Jun 2024
                        </div>
                      </div>
                      <span className="font-medium text-sm">₹1,20,000</span>
                    </div>
                    <div className="flex py-3 justify-between items-center">
                      <div>
                        <div className="font-medium text-sm">
                          ICICI bank transfer
                        </div>
                        <div className="text-muted-foreground text-xs mt-1">
                          Banking · 18 Jun 2024
                        </div>
                      </div>
                      <span className="font-medium text-sm">₹2,50,000</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-6">
                  <h2 className="font-semibold text-base">
                    Tasks to keep moving
                  </h2>
                  <div className="flex mt-5 flex-col gap-2">
                    <div className="rounded-md border border-border flex px-4 py-3 items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          Match 12 bank transactions
                        </div>
                        <span className="font-medium rounded-md bg-primary/10 text-primary text-xs inline-flex mt-1 px-2 py-1">
                          To do
                        </span>
                      </div>
                      <ChevronRight className="text-muted-foreground size-4" />
                    </div>
                    <div className="rounded-md border border-border flex px-4 py-3 items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          Upload purchase invoices
                        </div>
                        <span className="font-medium rounded-md bg-muted text-muted-foreground text-xs inline-flex mt-1 px-2 py-1">
                          Pending
                        </span>
                      </div>
                      <ChevronRight className="text-muted-foreground size-4" />
                    </div>
                    <div className="rounded-md border border-border flex px-4 py-3 items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          Review GST exceptions
                        </div>
                        <span className="font-medium rounded-md bg-muted text-muted-foreground text-xs inline-flex mt-1 px-2 py-1">
                          Pending
                        </span>
                      </div>
                      <ChevronRight className="text-muted-foreground size-4" />
                    </div>
                  </div>
                </Card>
              </div>
              <p className="text-muted-foreground text-xs mt-8">
                Sample data · Last synced 10 minutes ago
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

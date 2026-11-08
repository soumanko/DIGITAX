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
  Download,
  Landmark,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bar,
  BarChart as RechartsBarChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts';

export default function CashFlow() {
  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground min-h-screen">
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
                className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
                <span className="text-muted-foreground">Reports</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="font-medium text-foreground">Cash flow</span>
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
                    Cash flow
                  </h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Understand where money came from and where it went.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select defaultValue="Apr–Jun 2024">
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Apr–Jun 2024">Apr–Jun 2024</SelectItem>
                      <SelectItem value="Jan–Mar 2024">Jan–Mar 2024</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select defaultValue="Monthly">
                    <SelectTrigger className="w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button>
                    <Download className="mr-2 size-4" />
                    Export
                  </Button>
                </div>
              </div>
              <div className="grid mt-6 gap-4 grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm">
                      Opening cash
                    </p>
                    <p className="font-semibold text-xl mt-2">₹6,82,400</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm">Cash in</p>
                    <p className="font-semibold text-primary text-xl mt-2">
                      ₹28,64,000
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm">Cash out</p>
                    <p className="font-semibold text-xl mt-2">₹25,78,100</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-muted-foreground text-sm">
                      Closing cash
                    </p>
                    <p className="font-semibold text-xl mt-2">₹9,68,300</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="mt-6">
                <CardHeader className="flex pb-2 flex-row justify-between items-center">
                  <div className="mb-0">
                    <CardTitle>Cash movement</CardTitle>
                    <CardDescription>
                      Monthly inflows and outflows for the selected period
                    </CardDescription>
                  </div>
                  <div className="text-muted-foreground text-xs flex items-center gap-4">
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-chart-1 size-2.5" />
                      Cash in
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="rounded-full bg-chart-2 size-2.5" />
                      Cash out
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ChartContainer
                    config={{
                      cashIn: {
                        label: "Cash in",
                        color: "var(--color-chart-1)",
                      },
                      cashOut: {
                        label: "Cash out",
                        color: "var(--color-chart-2)",
                      },
                    }}
                    className="w-full h-64"
                  >
                    <RechartsBarChart
                      data={[
                        { month: "Apr", cashIn: 920000, cashOut: 780000 },
                        { month: "May", cashIn: 1040000, cashOut: 910000 },
                        { month: "Jun", cashIn: 904000, cashOut: 888100 },
                      ]}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ChartTooltip />
                      <Bar
                        dataKey="cashIn"
                        stackId="movement"
                        fill="var(--color-chart-1)"
                        radius={[0, 0, 0, 0]}
                      />
                      <Bar
                        dataKey="cashOut"
                        stackId="movement"
                        fill="var(--color-chart-2)"
                        radius={[4, 4, 0, 0]}
                      />
                    </RechartsBarChart>
                  </ChartContainer>
                  <p className="text-muted-foreground text-xs mt-2">
                    Values in INR · sample data
                  </p>
                </CardContent>
              </Card>
              <div className="grid mt-6 gap-6 grid-cols-2">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Cash in</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-sm border-x border-t border-b flex px-6 py-3 justify-between items-center">
                      <span>Razorpay settlements</span>
                      <span className="font-medium">₹12,84,000</span>
                    </div>
                    <div className="text-sm border-x border-t border-b flex px-6 py-3 justify-between items-center">
                      <span>Customer transfers</span>
                      <span className="font-medium">₹9,20,000</span>
                    </div>
                    <div className="text-sm border-x border-t border-b flex px-6 py-3 justify-between items-center">
                      <span>Other income</span>
                      <span className="font-medium">₹6,60,000</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Cash out</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="text-sm border-x border-t border-b flex px-6 py-3 justify-between items-center">
                      <span>Payroll</span>
                      <span className="font-medium">₹9,45,000</span>
                    </div>
                    <div className="text-sm border-x border-t border-b flex px-6 py-3 justify-between items-center">
                      <span>Vendors</span>
                      <span className="font-medium">₹8,74,100</span>
                    </div>
                    <div className="text-sm border-x border-t border-b flex px-6 py-3 justify-between items-center">
                      <span>Taxes</span>
                      <span className="font-medium">₹4,82,000</span>
                    </div>
                    <div className="text-sm border-x border-t border-b flex px-6 py-3 justify-between items-center">
                      <span>Operating expenses</span>
                      <span className="font-medium">₹2,77,000</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="font-medium text-foreground text-sm flex mt-5 justify-end">
                Net movement · +₹2,85,900
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}


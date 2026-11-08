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
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function Reports() {
  const router = useRouter();
  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground min-h-screen h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
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
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/banking')}
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
              <span className="font-medium text-foreground">Reports</span>
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
            <div className="flex justify-between items-end">
              <div className="flex flex-col gap-2">
                <h1 className="font-semibold text-2xl tracking-tight">
                  Reports
                </h1>
                <p className="text-muted-foreground text-sm">
                  Turn your books into decisions.
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
                    <SelectItem value="Jun 2024">Jun 2024</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">Export report</Button>
              </div>
            </div>
            <div className="grid mt-8 gap-6 grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>{`Profit & Loss`}</CardTitle>
                  <CardDescription>
                    Revenue, expenses, and net profit
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted flex p-4 items-end gap-3 h-28">
                    <div className="rounded-xs bg-chart-1/40 flex-1 h-10" />
                    <div className="rounded-xs bg-chart-1/60 flex-1 h-16" />
                    <div className="rounded-xs bg-chart-1/75 flex-1 h-12" />
                    <div className="rounded-xs bg-chart-1 flex-1 h-24" />
                    <div className="rounded-xs bg-chart-1/80 flex-1 h-20" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => router.push('/profit-&-loss')}
                  >
                    Open report
                  </Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Balance Sheet</CardTitle>
                  <CardDescription>
                    Assets, liabilities, and equity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted flex p-4 flex-col justify-end gap-2 h-28">
                    <div className="rounded-xs bg-chart-2 w-4/5 h-7" />
                    <div className="rounded-xs bg-chart-3 w-3/5 h-5" />
                    <div className="rounded-xs bg-chart-4 w-2/5 h-4" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">Open report</Button>
                </CardFooter>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Cash flow statement</CardTitle>
                  <CardDescription>
                    Money in, money out, and runway
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md bg-muted relative p-4 h-28 overflow-hidden">
                    <div className="rotate-12 bg-chart-1 absolute bottom-8 left-4 w-10 h-px" />
                    <div className="-rotate-12 bg-chart-1 absolute bottom-10 left-12 w-12 h-px" />
                    <div className="rotate-6 bg-chart-1 absolute bottom-5 left-24 w-12 h-px" />
                    <div className="-rotate-12 bg-chart-1 absolute bottom-8 left-36 w-10 h-px" />
                    <div className="rounded-full bg-chart-1 absolute bottom-5 left-44 size-2" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => router.push('/cash-flow')}
                  >
                    Open report
                  </Button>
                </CardFooter>
              </Card>
            </div>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Saved reports</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="text-left text-sm w-full">
                  <thead>
                    <tr className="text-muted-foreground border-t border-r border-b border-b-border border-l-border">
                      <th className="font-medium pb-3">Report</th>
                      <th className="font-medium pb-3">Period</th>
                      <th className="font-medium pb-3">Last generated</th>
                      <th className="font-medium pb-3">Owner</th>
                      <th className="font-medium pb-3">Format</th>
                      <th className="pb-3" />
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-r border-b border-b-border border-l-border">
                      <td className="font-medium py-4">{`Quarterly P&L`}</td>
                      <td className="text-muted-foreground py-4">Q1 FY25</td>
                      <td className="text-muted-foreground py-4">
                        24 Jun 2024
                      </td>
                      <td className="py-4">Ananya Kapoor</td>
                      <td className="py-4">PDF</td>
                      <td className="py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            aria-label="Download Quarterly P&L"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                          >
                            <Download className="size-4" />
                          </button>
                          <button
                            aria-label="More options for Quarterly P&L"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-t border-r border-b border-b-border border-l-border">
                      <td className="font-medium py-4">
                        GST liability summary
                      </td>
                      <td className="text-muted-foreground py-4">Jun 2024</td>
                      <td className="text-muted-foreground py-4">
                        22 Jun 2024
                      </td>
                      <td className="py-4">Arjun Mehta</td>
                      <td className="py-4">XLSX</td>
                      <td className="py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            aria-label="Download GST liability summary"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                          >
                            <Download className="size-4" />
                          </button>
                          <button
                            aria-label="More options for GST liability summary"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="font-medium py-4">
                        Vendor spend analysis
                      </td>
                      <td className="text-muted-foreground py-4">
                        Apr–Jun 2024
                      </td>
                      <td className="text-muted-foreground py-4">
                        18 Jun 2024
                      </td>
                      <td className="py-4">Ananya Kapoor</td>
                      <td className="py-4">PDF</td>
                      <td className="py-4">
                        <div className="flex justify-end gap-1">
                          <button
                            aria-label="Download Vendor spend analysis"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                          >
                            <Download className="size-4" />
                          </button>
                          <button
                            aria-label="More options for Vendor spend analysis"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Report schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">
                      Monthly management pack
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      First working day · Email to finance@asterlabs.in
                    </p>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  onClick={() => router.push('/team-activity')}
                >
                  Manage schedules
                </Button>
              </CardFooter>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}


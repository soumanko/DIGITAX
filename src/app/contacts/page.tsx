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
  Plus,
  ReceiptText,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function Contacts() {
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
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => router.push('/reports')}
            >
              <BarChart3 className="size-4" />
              <span>Reports</span>
            </a>
            <a
              href="#"
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
              <span className="font-medium text-foreground">Contacts</span>
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
                <h1 className="font-semibold text-2xl tracking-tight">
                  Contacts
                </h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Customers and vendors, in one trusted place.
                </p>
              </div>
              <Button className="gap-2 h-10">
                <Plus className="size-4" />
                Add contact
              </Button>
            </div>
            <div className="flex mt-8 justify-between items-center gap-4">
              <Tabs defaultValue="customers">
                <TabsList>
                  <TabsTrigger value="customers">Customers</TabsTrigger>
                  <TabsTrigger value="vendors">Vendors</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex items-center gap-3">
                <label className="rounded-md bg-card border border-input flex px-3 items-center gap-2 w-64 h-10">
                  <Search className="text-muted-foreground size-4" />
                  <input
                    placeholder="Search contacts"
                    defaultValue=""
                    className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                  />
                </label>
                <Select defaultValue="all">
                  <SelectTrigger className="w-40 h-10">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="review">Review needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid mt-6 gap-6 grid-cols-[minmax(0,1fr)_256px]">
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="text-left text-sm w-full">
                    <thead className="bg-muted border-t border-r border-b border-b-border border-l-border">
                      <tr>
                        <th className="font-medium text-muted-foreground px-6 py-3">
                          Name
                        </th>
                        <th className="font-medium text-muted-foreground px-4 py-3">
                          Type
                        </th>
                        <th className="font-medium text-muted-foreground px-4 py-3">
                          GSTIN
                        </th>
                        <th className="font-medium text-muted-foreground px-4 py-3">
                          Open balance
                        </th>
                        <th className="font-medium text-muted-foreground px-4 py-3">
                          Last activity
                        </th>
                        <th className="font-medium text-muted-foreground px-4 py-3">
                          Status
                        </th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-r border-b border-b-border border-l-border">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="bg-primary/15 text-primary size-9">
                              <AvatarFallback className="bg-primary/15 text-primary">
                                AL
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              Aster Labs Pvt. Ltd.
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">Customer</Badge>
                        </td>
                        <td className="font-mono text-muted-foreground text-xs p-4">
                          27AABCU9603R1ZV
                        </td>
                        <td className="p-4">₹0</td>
                        <td className="text-muted-foreground p-4">
                          24 Jun 2024
                        </td>
                        <td className="p-4">
                          <Badge className="bg-primary/10 text-primary">
                            Active
                          </Badge>
                        </td>
                        <td className="p-4">
                          <ChevronRight className="text-muted-foreground size-4" />
                        </td>
                      </tr>
                      <tr
                        className="border-t border-r border-b border-b-border border-l-border hidden"
                        onClick={() => router.push('/contacts/vendor-profile')}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="bg-accent text-accent-foreground size-9">
                              <AvatarFallback className="bg-accent text-accent-foreground">
                                TC
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              Tata Communications
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">Vendor</Badge>
                        </td>
                        <td className="font-mono text-muted-foreground text-xs p-4">
                          27AAACT1234F1Z7
                        </td>
                        <td className="p-4">₹24,380</td>
                        <td className="text-muted-foreground p-4">
                          21 Jun 2024
                        </td>
                        <td className="p-4">
                          <Badge className="bg-primary/10 text-primary">
                            Active
                          </Badge>
                        </td>
                        <td className="p-4">
                          <ChevronRight
                            className="text-muted-foreground size-4"
                            onClick={() => router.push('/contacts/vendor-profile')}
                          />
                        </td>
                      </tr>
                      <tr
                        className="border-t border-r border-b border-b-border border-l-border hidden"
                        onClick={() => router.push('/contacts/vendor-profile')}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="bg-secondary text-secondary-foreground size-9">
                              <AvatarFallback className="bg-secondary text-secondary-foreground">
                                AI
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">AWS India</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">Vendor</Badge>
                        </td>
                        <td className="font-mono text-muted-foreground text-xs p-4">
                          27AAICA1234A1Z5
                        </td>
                        <td className="p-4">₹42,180</td>
                        <td className="text-muted-foreground p-4">
                          23 Jun 2024
                        </td>
                        <td className="p-4">
                          <Badge className="bg-chart-3/15 text-foreground">
                            Review needed
                          </Badge>
                        </td>
                        <td className="p-4">
                          <ChevronRight
                            className="text-muted-foreground size-4"
                            onClick={() => router.push('/contacts/vendor-profile')}
                          />
                        </td>
                      </tr>
                      <tr
                        className="border-t border-r border-b border-b-border border-l-border hidden"
                        onClick={() => router.push('/contacts/vendor-profile')}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="bg-primary/10 text-primary size-9">
                              <AvatarFallback className="bg-primary/10 text-primary">
                                WI
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">WeWork India</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">Vendor</Badge>
                        </td>
                        <td className="font-mono text-muted-foreground text-xs p-4">
                          27AABCW4321H1Z9
                        </td>
                        <td className="p-4">₹14,220</td>
                        <td className="text-muted-foreground p-4">
                          19 Jun 2024
                        </td>
                        <td className="p-4">
                          <Badge className="bg-primary/10 text-primary">
                            Active
                          </Badge>
                        </td>
                        <td className="p-4">
                          <ChevronRight
                            className="text-muted-foreground size-4"
                            onClick={() => router.push('/contacts/vendor-profile')}
                          />
                        </td>
                      </tr>
                      <tr onClick={() => router.push('/contacts/vendor-profile')}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="bg-secondary text-secondary-foreground size-9">
                              <AvatarFallback className="bg-secondary text-secondary-foreground">
                                RS
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">
                              Razorpay Software Pvt Ltd
                            </span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="secondary">Customer</Badge>
                        </td>
                        <td className="font-mono text-muted-foreground text-xs p-4">
                          27AAICR1234B1Z6
                        </td>
                        <td className="p-4">₹86,400</td>
                        <td className="text-muted-foreground p-4">
                          24 Jun 2024
                        </td>
                        <td className="p-4">
                          <Badge className="bg-primary/10 text-primary">
                            Active
                          </Badge>
                        </td>
                        <td className="p-4">
                          <ChevronRight
                            className="text-muted-foreground size-4"
                            onClick={() => router.push('/contacts/vendor-profile')}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="border-x border-t border-b hidden justify-center items-center min-h-48">
                  <div className="text-center">
                    <p className="font-medium">No contacts found</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Try adjusting your search or status filter.
                    </p>
                  </div>
                </div>
                <div className="border-x border-t border-b flex px-6 py-4 justify-between items-center">
                  <span className="text-muted-foreground text-sm">
                    128 contacts
                  </span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="size-4" />
                    </Button>
                    <Button variant="secondary" size="icon" />
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
              <Card className="p-6 h-fit">
                <h2 className="font-semibold">Contact insights</h2>
                <div className="flex mt-6 flex-col gap-5">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Customers
                    </span>
                    <span className="font-semibold">86</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Vendors
                    </span>
                    <span className="font-semibold">42</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">
                      Needs attention
                    </span>
                    <span className="font-semibold text-destructive">3</span>
                  </div>
                  <div className="flex mt-2 items-end gap-3 h-24">
                    <div className="rounded-xs bg-primary/15 flex-1 h-full">
                      <div className="rounded-xs bg-primary h-4/5" />
                    </div>
                    <div className="rounded-xs bg-chart-2/15 flex-1 h-full">
                      <div className="rounded-xs bg-chart-2 h-2/5" />
                    </div>
                    <div className="rounded-xs bg-chart-3/15 flex-1 h-full">
                      <div className="rounded-xs bg-chart-3 h-1/5" />
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


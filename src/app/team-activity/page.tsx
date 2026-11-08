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
  SearchX,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function TeamActivity() {
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
                className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
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
                <span className="text-muted-foreground">Settings</span>
                <ChevronRight className="text-muted-foreground size-4" />
                <span className="font-medium text-foreground">
                  Team activity
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
              <div className="flex mb-8 justify-between items-start">
                <div>
                  <h1 className="font-semibold text-2xl tracking-tight">
                    Team activity
                  </h1>
                  <p className="text-muted-foreground text-sm mt-2">
                    A transparent log of changes across your workspace.
                  </p>
                </div>
                <Button className="gap-2">
                  <Download className="size-4" />
                  Export log
                </Button>
              </div>
              <div className="flex mb-6 items-center gap-3">
                <label className="rounded-md bg-card border border-input flex px-3 items-center gap-2 w-64 h-10">
                  <Search className="text-muted-foreground size-4" />
                  <input
                    type="search"
                    placeholder="Search activity"
                    defaultValue=""
                    className="bg-transparent text-sm outline-none w-full placeholder:text-muted-foreground"
                  />
                </label>
                <Select defaultValue="All members">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All members">All members</SelectItem>
                    <SelectItem value="Ananya Kapoor">Ananya Kapoor</SelectItem>
                    <SelectItem value="Arjun Mehta">Arjun Mehta</SelectItem>
                    <SelectItem value="Priya Shah">Priya Shah</SelectItem>
                    <SelectItem value="Neha Rao">Neha Rao</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="All actions">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All actions">All actions</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Imported">Imported</SelectItem>
                    <SelectItem value="Added">Added</SelectItem>
                    <SelectItem value="Changed">Changed</SelectItem>
                    <SelectItem value="Invited">Invited</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="Last 30 days">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Last 30 days">Last 30 days</SelectItem>
                    <SelectItem value="Last 7 days">Last 7 days</SelectItem>
                    <SelectItem value="Last 90 days">Last 90 days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid items-start gap-6 grid-cols-[minmax(0,1fr)_320px]">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent activity</CardTitle>
                    <CardDescription>5 events</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border-x border-t border-b">
                      <div>
                        <div className="border-t border-r border-b border-b-border border-l-border flex px-6 py-4 items-center gap-4">
                          <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center shrink-0 size-9">
                            AK
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">Ananya Kapoor</span>{" "}
                              approved GSTR-3B draft
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              24 Jun 2024
                            </p>
                          </div>
                          <Badge variant="secondary">{`GST & Tax`}</Badge>
                          <button
                            aria-label="More actions for Ananya Kapoor"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                        <div className="border-t border-r border-b border-b-border border-l-border flex px-6 py-4 items-center gap-4">
                          <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center shrink-0 size-9">
                            AM
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">Arjun Mehta</span>{" "}
                              imported 36 bank transactions
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              24 Jun 2024
                            </p>
                          </div>
                          <Badge variant="secondary">Banking</Badge>
                          <button
                            aria-label="More actions for Arjun Mehta"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                        <div className="border-t border-r border-b border-b-border border-l-border flex px-6 py-4 items-center gap-4">
                          <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center shrink-0 size-9">
                            AK
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">Ananya Kapoor</span>{" "}
                              added vendor Tata Communications
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              21 Jun 2024
                            </p>
                          </div>
                          <Badge variant="secondary">Contacts</Badge>
                          <button
                            aria-label="More actions for Ananya Kapoor"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                        <div className="border-t border-r border-b border-b-border border-l-border flex px-6 py-4 items-center gap-4">
                          <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center shrink-0 size-9">
                            PS
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">Priya Shah</span>{" "}
                              changed expense category from Travel to Software
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              20 Jun 2024
                            </p>
                          </div>
                          <Badge variant="secondary">Transactions</Badge>
                          <button
                            aria-label="More actions for Priya Shah"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                        <div className="flex px-6 py-4 items-center gap-4">
                          <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center shrink-0 size-9">
                            AM
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">
                              <span className="font-medium">Arjun Mehta</span>{" "}
                              invited Neha Rao to the workspace
                            </p>
                            <p className="text-muted-foreground text-xs mt-1">
                              18 Jun 2024
                            </p>
                          </div>
                          <Badge variant="secondary">Team</Badge>
                          <button
                            aria-label="More actions for Arjun Mehta"
                            className="rounded-md text-muted-foreground flex justify-center items-center size-8 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                          >
                            <MoreHorizontal className="size-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-center hidden px-6 py-16 flex-col justify-center items-center">
                        <SearchX className="text-muted-foreground mb-3 size-8" />
                        <p className="font-medium text-sm">No activity found</p>
                        <p className="text-muted-foreground text-sm mt-1">
                          Try a different search term.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Workspace members</CardTitle>
                    <CardDescription>4 active members</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-5">
                      <div className="flex items-center gap-3">
                        <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center size-9">
                          AK
                        </span>
                        <span>
                          <span className="font-medium text-sm block">
                            Ananya Kapoor
                          </span>
                          <span className="text-muted-foreground text-xs block">
                            Admin
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center size-9">
                          AM
                        </span>
                        <span>
                          <span className="font-medium text-sm block">
                            Arjun Mehta
                          </span>
                          <span className="text-muted-foreground text-xs block">
                            Accountant
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center size-9">
                          PS
                        </span>
                        <span>
                          <span className="font-medium text-sm block">
                            Priya Shah
                          </span>
                          <span className="text-muted-foreground text-xs block">
                            Finance
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium rounded-full bg-primary/10 text-primary text-xs flex justify-center items-center size-9">
                          NR
                        </span>
                        <span>
                          <span className="font-medium text-sm block">
                            Neha Rao
                          </span>
                          <span className="text-muted-foreground text-xs block">
                            Viewer
                          </span>
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" className="mt-6 w-full">
                      Manage members
                    </Button>
                  </CardContent>
                </Card>
              </div>
              <p className="text-muted-foreground text-xs mt-6">
                Activity is retained for 12 months · Sample data
              </p>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}


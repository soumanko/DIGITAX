'use client';

import React from 'react';
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
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function Settings() {
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
              onClick={() => window.location.href='/dashboard'}
            >
              <LayoutDashboard className="size-4" />
              <span>Overview</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => window.location.href='/transactions'}
            >
              <ArrowLeftRight className="size-4" />
              <span>Transactions</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => window.location.href='/gst'}
            >
              <ReceiptText className="size-4" />
              <span>{`GST & Tax`}</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => window.location.href='/banking'}
            >
              <Landmark className="size-4" />
              <span>Banking</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => window.location.href='/reports'}
            >
              <BarChart3 className="size-4" />
              <span>Reports</span>
            </a>
            <a
              href="#"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
              onClick={() => window.location.href='/contacts'}
            >
              <Users className="size-4" />
              <span>Contacts</span>
            </a>
            <a
              href="#"
              className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center gap-3 h-10"
            >
              <svg className="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
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
              <span className="font-medium text-foreground">Settings</span>
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
          <main className="px-8 pt-24 pb-12">
            <div className="max-w-6xl">
              <div className="mb-8">
                <h1 className="font-semibold text-foreground text-2xl tracking-tight">
                  Settings
                </h1>
                <p className="text-muted-foreground text-sm mt-2">
                  Control your workspace, team, and financial preferences.
                </p>
              </div>
              <div className="grid items-start gap-8 grid-cols-[220px_minmax(0,1fr)]">
                <Card className="rounded-lg">
                  <CardContent className="flex p-2 flex-col gap-1">
                    <a
                      href="#"
                      className="font-medium rounded-md bg-primary text-primary-foreground text-sm flex px-3 items-center h-10"
                    >
                      Workspace
                    </a>
                    <a
                      href="#"
                      className="rounded-md text-muted-foreground text-sm flex px-3 items-center h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                    >{`Team & permissions`}</a>
                    <a
                      href="#"
                      className="rounded-md text-muted-foreground text-sm flex px-3 items-center h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                    >
                      Notifications
                    </a>
                    <a
                      href="#"
                      className="rounded-md text-muted-foreground text-sm flex px-3 items-center h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                    >
                      Integrations
                    </a>
                    <a
                      href="#"
                      className="rounded-md text-muted-foreground text-sm flex px-3 items-center h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                    >
                      Billing
                    </a>
                  </CardContent>
                </Card>
                <div className="flex flex-col gap-6">
                  <Card className="rounded-lg">
                    <CardHeader>
                      <CardTitle>Workspace details</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                      <div className="grid gap-6 grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="business-name"
                            className="font-medium text-sm"
                          >
                            Business name
                          </label>
                          <Input
                            id="business-name"
                            defaultValue="Aster Labs Pvt. Ltd."
                            className="focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="legal-name"
                            className="font-medium text-sm"
                          >
                            Legal name
                          </label>
                          <Input
                            id="legal-name"
                            defaultValue="Aster Labs Private Limited"
                            className="focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label
                            htmlFor="gstin"
                            className="font-medium text-sm"
                          >
                            GSTIN
                          </label>
                          <Input
                            id="gstin"
                            defaultValue="27AABCU9603R1ZV"
                            className="focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label htmlFor="pan" className="font-medium text-sm">
                            PAN
                          </label>
                          <Input
                            id="pan"
                            defaultValue="AABCU9603R"
                            className="focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                        <div className="flex flex-col gap-2 col-span-2">
                          <label
                            htmlFor="registered-address"
                            className="font-medium text-sm"
                          >
                            Registered address
                          </label>
                          <Input
                            id="registered-address"
                            defaultValue="Bandra Kurla Complex, Mumbai, Maharashtra 400051"
                            className="focus-visible:ring-2 focus-visible:ring-ring"
                          />
                        </div>
                      </div>
                      <div className="border-x border-t border-b flex pt-6 justify-end items-center gap-3">
                        <Button variant="secondary">Discard</Button>
                        <Button>Save changes</Button>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg">
                    <CardHeader>
                      <CardTitle>Financial preferences</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-6">
                      <div className="grid gap-6 grid-cols-2">
                        <div className="flex flex-col gap-2">
                          <label className="font-medium text-sm">
                            Financial year
                          </label>
                          <Select defaultValue="FY 2024–25">
                            <SelectTrigger className="focus:ring-2 focus:ring-ring">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="FY 2024–25">
                                FY 2024–25
                              </SelectItem>
                              <SelectItem value="FY 2023–24">
                                FY 2023–24
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="font-medium text-sm">
                            Base currency
                          </label>
                          <Select defaultValue="INR — Indian Rupee">
                            <SelectTrigger className="focus:ring-2 focus:ring-ring">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="INR — Indian Rupee">
                                INR — Indian Rupee
                              </SelectItem>
                              <SelectItem value="USD — US Dollar">
                                USD — US Dollar
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="border-x border-t border-b flex pt-6 justify-between items-center">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium text-sm">
                            Lock closed months
                          </span>
                          <span className="text-muted-foreground text-sm">
                            Prevent edits to transactions in closed accounting
                            months.
                          </span>
                        </div>
                        <Switch defaultChecked={false} />
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="rounded-lg border-destructive/40">
                    <CardHeader>
                      <CardTitle>Danger zone</CardTitle>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center gap-6">
                      <p className="text-muted-foreground text-sm">
                        Disconnecting your workspace removes bank sync access.
                      </p>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        Disconnect workspace
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}


'use client';

import React, { useEffect, useState } from 'react';
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
import { useShopContext, identityInitials } from '@/lib/client/use-shop-context';
import { StaticBusinessName } from '@/components/layout/static-business-name';

function fyLabel(startYear: number): string {
  return `FY ${startYear}–${String((startYear + 1) % 100).padStart(2, '0')}`;
}

export default function Settings() {
  const router = useRouter();
  const {
    shop,
    loading: ctxLoading,
    error: ctxError,
    needsOnboarding,
    userEmail,
    refresh,
  } = useShopContext();

  const [currentFy, setCurrentFy] = useState<number | null>(null);
  const [fy, setFy] = useState('');

  // Resolved on the client after mount (never during prerender).
  useEffect(() => {
    let cancelled = false;
    async function init() {
      await Promise.resolve();
      if (cancelled) return;
      const t = new Date();
      setCurrentFy(t.getMonth() + 1 >= 4 ? t.getFullYear() : t.getFullYear() - 1);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const schemeLabel: Record<string, string> = {
    regular: 'Regular',
    composition_goods: 'Composition (goods)',
    composition_services: 'Composition (services)',
    qrmp: 'QRMP',
  };

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
              <StaticBusinessName />
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
            <Link
              href="/dashboard"
              className="rounded-md text-muted-foreground text-sm flex px-3 items-center gap-3 h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
            >
              <CircleHelp className="size-4" />
              <span>{`Help & support`}</span>
            </Link>
            <button className="text-left rounded-md flex px-3 py-2 items-center gap-3 hover:bg-accent active:bg-muted hover:active:bg-muted">
              <span className="font-medium rounded-full bg-primary text-primary-foreground text-xs flex justify-center items-center shrink-0 size-8">
                {identityInitials(userEmail)}
              </span>
              <span className="min-w-0">
                <span className="font-medium text-ellipsis whitespace-nowrap text-foreground text-sm block overflow-hidden">
                  {userEmail || 'Signed in'}
                </span>
                <span className="text-ellipsis whitespace-nowrap text-muted-foreground text-xs block overflow-hidden">
                  Account
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
                {identityInitials(userEmail)}
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
              {ctxError ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <p className="font-medium">Could not load your business context.</p>
                    <Button className="mt-4 h-9" onClick={() => refresh()}>
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : ctxLoading ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <p className="font-medium text-muted-foreground">Loading your workspace…</p>
                  </CardContent>
                </Card>
              ) : needsOnboarding ? (
                <Card>
                  <CardContent className="p-10 text-center">
                    <Building2 className="text-muted-foreground size-10 mx-auto" />
                    <p className="font-medium mt-4">No business yet</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Complete onboarding to set up your workspace.
                    </p>
                    <Button className="mt-4 h-9" onClick={() => router.push('/onboarding')}>
                      Set up business
                    </Button>
                  </CardContent>
                </Card>
              ) : (
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
                        title="Team membership is managed through shop records — invites surface in Team activity."
                      >{`Team & permissions`}</a>
                      <a
                        href="#"
                        className="rounded-md text-muted-foreground text-sm flex px-3 items-center h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                        title="Notification rules are not configurable in this release."
                      >
                        Notifications
                      </a>
                      <a
                        href="#"
                        className="rounded-md text-muted-foreground text-sm flex px-3 items-center h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                        title="No third-party bank/feed integrations are connected for this workspace."
                      >
                        Integrations
                      </a>
                      <a
                        href="#"
                        className="rounded-md text-muted-foreground text-sm flex px-3 items-center h-10 hover:bg-accent hover:text-foreground active:bg-muted hover:active:bg-muted"
                        title="DIGITAX billing is not configured in this release."
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
                              value={shop?.name || ''}
                              readOnly
                              title="Sourced from your authorised business record — profile updates need a workspace update API."
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
                              value={shop?.business_type || ''}
                              readOnly
                              placeholder="Not recorded"
                              title="Business type from your onboarding record."
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
                              value={shop?.gstin || ''}
                              readOnly
                              placeholder="Not recorded"
                              title="GSTIN registered for this business."
                              className="focus-visible:ring-2 focus-visible:ring-ring font-mono"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <label htmlFor="pan" className="font-medium text-sm">
                              Tax scheme
                            </label>
                            <Input
                              id="pan"
                              value={schemeLabel[shop?.taxpayer_scheme || 'regular'] || 'Regular'}
                              readOnly
                              title="Taxpayer scheme chosen during onboarding."
                              className="focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </div>
                          <div className="flex flex-col gap-2 col-span-2">
                            <label
                              htmlFor="registered-address"
                              className="font-medium text-sm"
                            >
                              State · Language
                            </label>
                            <Input
                              id="registered-address"
                              value={[
                                shop?.state || shop?.state_code || 'State not recorded',
                                shop?.preferred_language
                                  ? (shop.preferred_language === 'en'
                                      ? 'English'
                                      : shop.preferred_language === 'hi'
                                        ? 'Hindi'
                                        : shop.preferred_language === 'bn'
                                          ? 'Bengali'
                                          : 'Marathi')
                                  : 'Language not set',
                              ].join(' · ')}
                              readOnly
                              title="Place of supply preferences from your business record."
                              className="focus-visible:ring-2 focus-visible:ring-ring"
                            />
                          </div>
                        </div>
                        <div className="border-x border-t border-b flex pt-6 justify-end items-center gap-3">
                          <Button
                            variant="secondary"
                            title="Nothing has been changed — values are live from the business record."
                          >
                            Discard
                          </Button>
                          <Button
                            title="Workspace edits need a profile-update API (proposed migration) — this release shows the live record read-only."
                          >
                            Save changes
                          </Button>
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
                            <Select value={fy || (currentFy ? `fy-${currentFy}` : '')} onValueChange={(v) => setFy(v)}>
                              <SelectTrigger className="focus:ring-2 focus:ring-ring">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(currentFy !== null ? [currentFy, currentFy - 1] : []).map((y) => (
                                  <SelectItem key={y} value={`fy-${y}`}>
                                    {fyLabel(y)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2">
                            <label
                              className="font-medium text-sm"
                              title="DIGITAX records are computed in INR only — statutory GST filing is rupee-denominated."
                            >
                              Base currency
                            </label>
                            <Select
                              value="INR — Indian Rupee"
                              disabled
                            >
                              <SelectTrigger className="focus:ring-2 focus:ring-ring">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="INR — Indian Rupee">
                                  INR — Indian Rupee
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
                          <label title="Month locking requires a filing-period lock API (proposed migration) — not active in this release.">
                            <Switch defaultChecked={false} disabled />
                          </label>
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="rounded-lg border-destructive/40">
                      <CardHeader>
                        <CardTitle>Danger zone</CardTitle>
                      </CardHeader>
                      <CardContent className="flex justify-between items-center gap-6">
                        <p className="text-muted-foreground text-sm">
                          No bank feeds are connected to this workspace — nothing to disconnect. Account delete lives under Account actions on the Overview page.
                        </p>
                        <Button
                          variant="outline"
                          className="text-destructive border-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => router.push('/dashboard')}
                          title="Go to Overview → Account actions"
                        >
                          Disconnect workspace
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

'use client';

import Link from 'next/link';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  FileLock2,
  FileText,
  FolderLock,
  GitCompareArrows,
  LayoutDashboard,
  LockKeyhole,
  Menu,
  MessageCircle,
  MoreHorizontal,
  ReceiptText,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Upload,
  UsersRound,
  Wallet,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground w-full h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <header className="backdrop-blur-sm bg-background/95 border-t-border/70 border-r-border/70 border-b border-b-border/70 border-l-border/70 sticky z-40 top-0">
          <div className="flex mx-auto px-6 justify-between items-center h-20 max-w-7xl lg:px-10 backdrop-blur-md bg-background/80 border-b border-border/50">
            <a href="#" aria-label="DIGITAX home" className="flex items-center gap-3">
              <img src="/logo.svg" alt="DIGITAX logo mark" className="rounded-md size-9 object-cover" />
              <span className="font-semibold text-primary text-lg tracking-[0.18em]">
                DIGITAX
              </span>
            </a>
            <nav aria-label="Primary navigation" className="hidden items-center gap-8 lg:flex">
              <a href="#product" className="transition-colors text-muted-foreground text-sm hover:text-primary">
                Product
              </a>
              <a href="#solutions" className="transition-colors text-muted-foreground text-sm hover:text-primary">
                Solutions
              </a>
              <a href="#gst-tools" className="transition-colors text-muted-foreground text-sm hover:text-primary">
                GST Tools
              </a>
              <a href="#about" className="transition-colors text-muted-foreground text-sm hover:text-primary">
                About
              </a>
            </nav>
            <div className="hidden items-center gap-5 lg:flex">
              <a href="/login" className="font-medium transition-colors text-primary text-sm hover:text-accent">
                Login
              </a>
              <a href="/register" className="font-semibold transition-transform rounded-md bg-accent text-accent-foreground text-sm inline-flex px-4 py-2.5 items-center gap-2 hover:-translate-y-0.5">
                Get started
                <ArrowUpRight className="size-4" />
              </a>
            </div>
            <button type="button" aria-label="Toggle navigation" className="rounded-md text-primary border border-border inline-flex justify-center items-center size-10 lg:hidden">
              <Menu className="size-5" />
            </button>
          </div>
          <div className="bg-background border-x-border border-t border-t-border border-b-border hidden px-6 py-5 lg:hidden">
            <div className="flex mx-auto flex-col gap-4 max-w-7xl">
              <a href="#product" className="text-muted-foreground text-sm">
                Product
              </a>
              <a href="#solutions" className="text-muted-foreground text-sm">
                Solutions
              </a>
              <a href="#gst-tools" className="text-muted-foreground text-sm">
                GST Tools
              </a>
              <a href="#about" className="text-muted-foreground text-sm">
                About
              </a>
              <div className="border-x-border border-t border-t-border border-b-border flex pt-4 items-center gap-4">
                <a href="/login" className="font-medium text-primary text-sm">
                  Login
                </a>
                <a href="/register" className="font-semibold rounded-md bg-accent text-accent-foreground text-sm inline-flex px-4 py-2.5 items-center gap-2">
                  Get started
                  <ArrowUpRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </header>
        <main id="top">
          <section className="px-6 pt-20 pb-24 overflow-hidden lg:px-10 lg:pt-28 lg:pb-32" style={{ background: 'linear-gradient(to bottom, #ffffff 0%, #f1f5f9 15%, #f1f5f9 100%)' }}>
            <div className="mx-auto max-w-7xl">
              <div className="text-center mx-auto max-w-4xl">
                <p className="font-semibold uppercase text-muted-foreground text-xs tracking-[0.28em] mb-7">
                  A clearer business workspace
                </p>
                <h1 className="font-light text-primary text-5xl leading-[1.02] -tracking-[0.06em] sm:text-6xl lg:text-8xl">
                  GST, invoices and business finances.
                  <span className="text-accent block">Working together.</span>
                </h1>
                <p className="text-muted-foreground text-lg leading-8 mx-auto mt-8 max-w-2xl">
                  Manage invoices, bank transactions, GST insights and business
                  documents in one connected workspace.
                </p>
                <div className="flex mt-10 flex-col justify-center items-center gap-4 sm:flex-row">
                  <a
                    href="/register"
                    className="font-semibold transition-transform rounded-md bg-accent text-accent-foreground text-sm inline-flex px-6 py-3.5 justify-center items-center gap-2 hover:-translate-y-0.5"
                  >
                    Get started
                    <ArrowUpRight className="size-4" />
                  </a>
                  <a
                    href="#product"
                    className="font-medium transition-colors text-primary text-sm inline-flex px-3 py-3.5 items-center gap-2 hover:text-accent"
                  >
                    Explore DIGITAX
                    <ArrowDown className="size-4" />
                  </a>
                </div>
              </div>
              <div className="relative mx-auto mt-20 max-w-6xl">
                <div className="blur-3xl rounded-full bg-accent/10 hidden absolute top-16 -left-16 size-44 lg:block" />
                <div className="blur-3xl rounded-full bg-secondary/70 hidden absolute -right-20 bottom-0 size-64 lg:block" />
                <div
                  aria-label="Illustrative preview of the DIGITAX dashboard with sample data"
                  className="shadow-lg rounded-xl bg-card border border-border relative overflow-hidden"
                >
                  <div className="border-t-border border-r-border border-b border-b-border border-l-border flex px-5 justify-between items-center h-14 sm:px-7">
                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-accent size-2" />
                      <span className="font-semibold text-primary text-sm">
                        DIGITAX workspace
                      </span>
                      <span className="text-muted-foreground text-xs hidden sm:inline">
                        Illustrative preview · Sample data
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Search className="text-muted-foreground size-4" />
                      <span className="font-semibold rounded-full bg-secondary text-primary text-xs hidden justify-center items-center size-7 sm:flex">
                        AR
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 min-h-[440px] lg:grid-cols-[180px_1fr]">
                    <aside className="bg-secondary/35 border-y-border border-r border-r-border border-l-border hidden p-4 lg:block">
                      <p className="font-semibold uppercase text-muted-foreground text-[10px] tracking-[0.2em] mb-5 px-3">
                        Workspace
                      </p>
                      <div>
                        <div className="font-medium rounded-md bg-primary text-primary-foreground text-xs flex mb-1 px-3 py-2.5 items-center gap-3">
                          <LayoutDashboard className="size-4" />
                          Overview
                        </div>
                        <div className="rounded-md text-muted-foreground text-xs flex mb-1 px-3 py-2.5 items-center gap-3">
                          <FileText className="size-4" />
                          Invoices
                        </div>
                        <div className="rounded-md text-muted-foreground text-xs flex mb-1 px-3 py-2.5 items-center gap-3">
                          <ArrowLeftRight className="size-4" />
                          Transactions
                        </div>
                        <div className="rounded-md text-muted-foreground text-xs flex mb-1 px-3 py-2.5 items-center gap-3">
                          <RefreshCw className="size-4" />
                          Reconciliation
                        </div>
                        <div className="rounded-md text-muted-foreground text-xs flex px-3 py-2.5 items-center gap-3">
                          <ReceiptText className="size-4" />
                          GST workspace
                        </div>
                      </div>
                      <div className="border-x-border border-t border-t-border border-b-border mt-24 pt-4">
                        <div className="text-muted-foreground text-xs flex px-3 py-2.5 items-center gap-3">
                          <Settings2 className="size-4" />
                          Settings
                        </div>
                      </div>
                    </aside>
                    <div className="p-5 sm:p-7">
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Good morning, Arjun
                          </p>
                          <h2 className="font-semibold text-primary text-2xl tracking-tight mt-1">
                            Business overview
                          </h2>
                        </div>
                        <div className="rounded-md text-muted-foreground text-xs border border-border flex px-3 py-2 items-center gap-2">
                          <CalendarDays className="size-3.5" />
                          This month
                          <ChevronDown className="size-3.5" />
                        </div>
                      </div>
                      <div className="grid mt-7 gap-3 sm:grid-cols-3">
                        <div className="rounded-lg border border-border p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-xs">
                              Cash position
                            </span>
                            <Wallet className="text-accent size-4" />
                          </div>
                          <p className="font-semibold text-primary text-2xl mt-5">
                            ₹ 4,82,400
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Sample data · +8.4%
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-xs">
                              Open invoices
                            </span>
                            <FileText className="text-accent size-4" />
                          </div>
                          <p className="font-semibold text-primary text-2xl mt-5">
                            18
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            ₹ 1,26,800 outstanding
                          </p>
                        </div>
                        <div className="rounded-lg border border-border p-4">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-xs">
                              GST overview
                            </span>
                            <ReceiptText className="text-accent size-4" />
                          </div>
                          <p className="font-semibold text-primary text-2xl mt-5">
                            Ready to review
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Last updated today
                          </p>
                        </div>
                      </div>
                      <div className="grid mt-4 gap-4 lg:grid-cols-[1.35fr_0.65fr]">
                        <div className="rounded-lg border border-border p-5">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-semibold text-primary text-sm">
                                Cash flow
                              </p>
                              <p className="text-muted-foreground text-xs mt-1">
                                Incoming and outgoing activity
                              </p>
                            </div>
                            <span className="font-medium rounded-full bg-secondary text-primary text-[10px] px-2.5 py-1">
                              Sample data
                            </span>
                          </div>
                          <div className="flex mt-7 items-end gap-3 h-36 sm:gap-5">
                            <div className="flex items-end flex-1 gap-1.5 h-full">
                              <span className="rounded-t-sm bg-secondary flex-1 h-[36%]" />
                              <span className="rounded-t-sm bg-secondary flex-1 h-[55%]" />
                              <span className="rounded-t-sm bg-secondary flex-1 h-[44%]" />
                              <span className="rounded-t-sm bg-accent/70 flex-1 h-[68%]" />
                              <span className="rounded-t-sm bg-accent flex-1 h-3/5" />
                              <span className="rounded-t-sm bg-accent flex-1 h-[78%]" />
                              <span className="rounded-t-sm bg-accent flex-1 h-[72%]" />
                            </div>
                          </div>
                          <div className="text-muted-foreground text-[10px] flex mt-3 justify-between">
                            <span>Apr</span>
                            <span>May</span>
                            <span>Jun</span>
                            <span>Jul</span>
                            <span>Aug</span>
                            <span>Sep</span>
                            <span>Oct</span>
                          </div>
                        </div>
                        <div className="rounded-lg border border-border p-5">
                          <div className="flex justify-between items-center">
                            <p className="font-semibold text-primary text-sm">
                              Recent activity
                            </p>
                            <MoreHorizontal className="text-muted-foreground size-4" />
                          </div>
                          <div className="mt-5">
                            <div className="flex mb-4 items-start gap-3">
                              <span className="rounded-md bg-secondary text-primary flex mt-0.5 justify-center items-center size-7">
                                <ArrowDownLeft className="size-3.5" />
                              </span>
                              <div>
                                <p className="font-medium text-primary text-xs">
                                  Payment received
                                </p>
                                <p className="text-muted-foreground text-[10px] mt-0.5">
                                  INV-0248 · ₹ 24,500
                                </p>
                              </div>
                            </div>
                            <div className="flex mb-4 items-start gap-3">
                              <span className="rounded-md bg-secondary text-primary flex mt-0.5 justify-center items-center size-7">
                                <RefreshCw className="size-3.5" />
                              </span>
                              <div>
                                <p className="font-medium text-primary text-xs">
                                  Match suggested
                                </p>
                                <p className="text-muted-foreground text-[10px] mt-0.5">
                                  2 transactions to review
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3">
                              <span className="rounded-md bg-secondary text-primary flex mt-0.5 justify-center items-center size-7">
                                <FileCheck2 className="size-3.5" />
                              </span>
                              <div>
                                <p className="font-medium text-primary text-xs">
                                  GST summary ready
                                </p>
                                <p className="text-muted-foreground text-[10px] mt-0.5">
                                  September period
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section
            id="product"
            className="bg-secondary/25 border-x-border border-y border-y-border px-6 py-24 lg:px-10 lg:py-32"
          >
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-16 lg:items-center lg:gap-24 lg:grid-cols-[0.75fr_1.25fr]">
                <div>
                  <p className="font-semibold uppercase text-muted-foreground text-xs tracking-[0.28em]">
                    One connected picture
                  </p>
                  <h2 className="font-light text-primary text-4xl leading-tight -tracking-[0.04em] mt-6 sm:text-5xl">
                    Your business.
                    <br />
                    <span className="text-accent">A clearer picture.</span>
                  </h2>
                  <p className="text-muted-foreground text-base leading-7 mt-7 max-w-md">
                    Bring the everyday details of your business together and
                    spend less time switching between disconnected tools.
                  </p>
                  <a
                    href="#gst-tools"
                    className="font-semibold transition-colors text-primary text-sm inline-flex mt-8 items-center gap-2 hover:text-accent"
                  >
                    See how it connects
                    <ArrowRight className="size-4" />
                  </a>
                </div>
                <div
                  aria-label="Illustrative product overview with sample data"
                  className="shadow-sm rounded-xl bg-card border border-border p-5 sm:p-7"
                >
                  <div className="border-t-border border-r-border border-b border-b-border border-l-border flex pb-5 justify-between items-center">
                    <div>
                      <p className="text-muted-foreground text-xs">
                        September 2024 · Sample data
                      </p>
                      <p className="font-semibold text-primary text-lg mt-1">
                        Financial overview
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label="More overview options"
                      className="text-muted-foreground"
                    >
                      <MoreHorizontal className="size-5" />
                    </button>
                  </div>
                  <div className="grid pt-6 gap-7 sm:grid-cols-2">
                    <div>
                      <p className="text-muted-foreground text-xs">
                        Total invoiced
                      </p>
                      <p className="font-light text-primary text-3xl tracking-tight mt-2">
                        ₹ 8,42,600
                      </p>
                      <div className="rounded-full bg-secondary mt-5 h-2 overflow-hidden">
                        <div className="rounded-full bg-accent w-3/4 h-full" />
                      </div>
                      <div className="text-muted-foreground text-[11px] flex mt-2 justify-between">
                        <span>Collected ₹ 6,31,200</span>
                        <span>75%</span>
                      </div>
                    </div>
                    <div className="border-x-border border-t border-t-border border-b-border pt-5 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-7">
                      <p className="text-muted-foreground text-xs">
                        GST summary
                      </p>
                      <div className="flex mt-3 items-center gap-4">
                        <div className="rounded-full border-t-7 border-t-accent border-r-7 border-r-secondary border-b-7 border-b-secondary border-l-7 border-l-accent flex justify-center items-center size-16">
                          <span className="font-semibold text-primary text-sm">
                            68%
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-primary text-sm">
                            Ready to review
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Input and output tax records
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="border-x-border border-t border-t-border border-b-border grid mt-8 pt-6 gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-secondary/60 p-4">
                      <p className="text-muted-foreground text-[11px]">
                        Incoming
                      </p>
                      <p className="font-semibold text-primary text-lg mt-2">
                        ₹ 3,24,800
                      </p>
                      <p className="text-accent text-[10px] mt-1">
                        +12.8% this period
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-4">
                      <p className="text-muted-foreground text-[11px]">
                        Outgoing
                      </p>
                      <p className="font-semibold text-primary text-lg mt-2">
                        ₹ 1,86,400
                      </p>
                      <p className="text-muted-foreground text-[10px] mt-1">
                        Across 34 records
                      </p>
                    </div>
                    <div className="rounded-lg bg-secondary/60 p-4">
                      <p className="text-muted-foreground text-[11px]">
                        To reconcile
                      </p>
                      <p className="font-semibold text-primary text-lg mt-2">
                        12 items
                      </p>
                      <p className="text-muted-foreground text-[10px] mt-1">
                        Suggested matches
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section
            id="gst-tools"
            className="bg-[#b7bcc7] text-primary-foreground px-6 py-24 lg:px-10 lg:py-32"
          >
            <div className="mx-auto max-w-7xl">
              <div className="max-w-2xl">
                <p className="font-semibold uppercase text-accent text-xs tracking-[0.28em]">
                  Connected workflows
                </p>
                <h2 className="font-light text-4xl leading-tight -tracking-[0.04em] mt-6 sm:text-6xl">
                  The details connect.
                  <br />
                  <span className="text-accent">
                    The business moves forward.
                  </span>
                </h2>
                <p className="text-primary-foreground/70 text-base leading-7 mt-7 max-w-xl">
                  From invoices and bank activity to GST summaries, keep the
                  work connected and the next step clear.
                </p>
              </div>
              <div className="mt-24 lg:mt-32">
                <div className="grid mb-24 items-center gap-12 lg:mb-36 lg:gap-24 lg:grid-cols-2">
                  <div>
                    <span className="font-medium text-accent text-sm">
                      01 — Invoices
                    </span>
                    <h3 className="font-light text-3xl tracking-tight mt-5 sm:text-4xl">
                      From invoice to insight.
                    </h3>
                    <p className="text-primary-foreground/70 text-base leading-7 mt-5 max-w-md">
                      Create and manage invoices while keeping important
                      business details organized.
                    </p>
                    <a
                      href="#features"
                      className="font-medium text-accent text-sm inline-flex mt-7 items-center gap-2"
                    >
                      Explore invoicing
                      <ArrowUpRight className="size-4" />
                    </a>
                  </div>
                  <div className="rounded-xl border border-primary-foreground/15 p-4 sm:p-6 shadow-xl">
                    <div className="shadow-xl rounded-lg bg-background text-foreground p-5 sm:p-7">
                      <div className="border-t-border border-r-border border-b border-b-border border-l-border flex pb-5 justify-between items-center">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            New invoice
                          </p>
                          <p className="font-semibold text-primary text-lg mt-1">
                            INV-0248
                          </p>
                        </div>
                        <span className="font-medium rounded-full bg-secondary text-primary text-[10px] px-3 py-1">
                          Draft
                        </span>
                      </div>
                      <div className="grid py-6 gap-5 sm:grid-cols-2">
                        <div>
                          <p className="uppercase text-muted-foreground text-[10px] tracking-[0.16em]">
                            Bill to
                          </p>
                          <p className="font-medium text-primary text-sm mt-2">
                            Northstar Retail
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            GSTIN 29AABCN0000A1Z5
                          </p>
                        </div>
                        <div>
                          <p className="uppercase text-muted-foreground text-[10px] tracking-[0.16em]">
                            Amount
                          </p>
                          <p className="font-semibold text-primary text-2xl mt-2">
                            ₹ 24,500
                          </p>
                          <p className="text-muted-foreground text-xs mt-1">
                            Including applicable GST
                          </p>
                        </div>
                      </div>
                      <div className="border-x-border border-t border-t-border border-b-border flex pt-5 justify-between items-center">
                        <span className="text-muted-foreground text-xs">
                          Sample document
                        </span>
                        <span className="font-medium text-primary text-xs inline-flex items-center gap-2">
                          <FileCheck2 className="text-accent size-4" />
                          Ready to send
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid mb-24 items-center gap-12 lg:mb-36 lg:gap-24 lg:grid-cols-2">
                  <div className="rounded-xl border border-primary-foreground/15 p-4 order-2 sm:p-6 lg:order-1 shadow-xl">
                    <div className="shadow-xl rounded-lg bg-background text-foreground p-5 sm:p-7">
                      <div className="border-t-border border-r-border border-b border-b-border border-l-border flex pb-5 justify-between items-center">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            Reconciliation
                          </p>
                          <p className="font-semibold text-primary text-lg mt-1">
                            October activity
                          </p>
                        </div>
                        <span className="font-medium rounded-full bg-secondary text-primary text-[10px] px-3 py-1">
                          Sample data
                        </span>
                      </div>
                      <div className="mt-5">
                        <div className="rounded-md border border-border flex mb-3 p-3 items-center gap-3">
                          <span className="rounded-md bg-secondary text-primary flex justify-center items-center size-8">
                            <ArrowDownLeft className="size-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-ellipsis whitespace-nowrap text-primary text-xs overflow-hidden">
                              NEFT / Northstar Retail
                            </p>
                            <p className="text-muted-foreground text-[10px] mt-1">
                              12 Oct · ₹ 24,500
                            </p>
                          </div>
                          <span className="text-accent">
                            <CheckCircle2 className="size-4" />
                          </span>
                        </div>
                        <div className="rounded-md border border-border flex p-3 items-center gap-3">
                          <span className="rounded-md bg-secondary text-primary flex justify-center items-center size-8">
                            <ArrowUpRight className="size-4" />
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-ellipsis whitespace-nowrap text-primary text-xs overflow-hidden">
                              Office supplies
                            </p>
                            <p className="text-muted-foreground text-[10px] mt-1">
                              11 Oct · ₹ 4,280
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label="Review suggested match"
                            className="font-semibold rounded-md bg-accent text-accent-foreground text-[10px] px-2.5 py-1.5"
                          >
                            Review
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="order-1 lg:order-2">
                    <span className="font-medium text-accent text-sm">
                      02 — Reconciliation
                    </span>
                    <h3 className="font-light text-3xl tracking-tight mt-5 sm:text-4xl">
                      Bring transactions into context.
                    </h3>
                    <p className="text-primary-foreground/70 text-base leading-7 mt-5 max-w-md">
                      Import bank statements and review transaction matches in
                      one workspace.
                    </p>
                    <a
                      href="#features"
                      className="font-medium text-accent text-sm inline-flex mt-7 items-center gap-2"
                    >
                      See reconciliation
                      <ArrowUpRight className="size-4" />
                    </a>
                  </div>
                </div>
                <div className="grid items-center gap-12 lg:gap-24 lg:grid-cols-2">
                  <div>
                    <span className="font-medium text-accent text-sm">
                      03 — GST
                    </span>
                    <h3 className="font-light text-3xl tracking-tight mt-5 sm:text-4xl">
                      Make GST information easier to follow.
                    </h3>
                    <p className="text-primary-foreground/70 text-base leading-7 mt-5 max-w-md">
                      Review GST summaries and prepare exports from your
                      business records.
                    </p>
                    <a
                      href="#faq"
                      className="font-medium text-accent text-sm inline-flex mt-7 items-center gap-2"
                    >
                      Understand GST tools
                      <ArrowUpRight className="size-4" />
                    </a>
                  </div>
                  <div className="rounded-xl border border-primary-foreground/15 p-4 sm:p-6 shadow-xl">
                    <div className="shadow-xl rounded-lg bg-background text-foreground p-5 sm:p-7">
                      <div className="border-t-border border-r-border border-b border-b-border border-l-border flex pb-5 justify-between items-center">
                        <div>
                          <p className="text-muted-foreground text-xs">
                            GST workspace
                          </p>
                          <p className="font-semibold text-primary text-lg mt-1">
                            September summary
                          </p>
                        </div>
                        <ReceiptText className="text-accent size-5" />
                      </div>
                      <div className="grid mt-6 gap-3 grid-cols-2">
                        <div className="rounded-md border border-border p-4">
                          <p className="text-muted-foreground text-[10px]">
                            Output tax
                          </p>
                          <p className="font-semibold text-primary text-lg mt-2">
                            ₹ 42,680
                          </p>
                          <p className="text-muted-foreground text-[10px] mt-1">
                            Across 46 invoices
                          </p>
                        </div>
                        <div className="rounded-md border border-border p-4">
                          <p className="text-muted-foreground text-[10px]">
                            Input tax
                          </p>
                          <p className="font-semibold text-primary text-lg mt-2">
                            ₹ 18,420
                          </p>
                          <p className="text-muted-foreground text-[10px] mt-1">
                            Across 31 records
                          </p>
                        </div>
                      </div>
                      <div className="rounded-md bg-secondary/60 flex mt-4 p-4 justify-between items-center">
                        <span className="font-medium text-primary text-xs">
                          Net summary to review
                        </span>
                        <span className="font-semibold text-primary text-sm">
                          ₹ 24,260
                        </span>
                      </div>
                      <p className="text-muted-foreground text-[10px] mt-4">
                        Illustrative preview. Summary and export support may
                        vary by configuration.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section id="features" className="px-6 py-24 lg:px-10 lg:py-32">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-2xl">
                <p className="font-semibold uppercase text-muted-foreground text-xs tracking-[0.28em]">
                  A workspace that keeps up
                </p>
                <h2 className="font-light text-primary text-4xl leading-tight -tracking-[0.04em] mt-6 sm:text-6xl">
                  Built around the way your business works.
                </h2>
                <p className="text-muted-foreground text-base leading-7 mt-7">
                  Less time piecing things together. More time understanding
                  what comes next.
                </p>
              </div>
              <div className="border-x-border border-t border-t-border border-b-border grid mt-20 gap-0 md:grid-cols-2">
                <div className="border-t-border-strong border-r-border-strong border-b border-b-border-strong border-l-border-strong p-2 md:border-r md:pr-12 rounded-[16px]">
                  <span className="font-semibold uppercase text-accent text-xs tracking-[0.2em]">
                    01 · Invoicing
                  </span>
                  <h3 className="font-light text-primary text-2xl mt-5">
                    Make every invoice easier to follow.
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6 mt-4 max-w-md">
                    Create and manage business invoices, track status, and keep
                    invoice information organized.
                  </p>
                  <div className="text-primary text-xs flex mt-7 items-center gap-3">
                    <FileText className="text-accent size-4" />
                    Draft · Sent · Paid
                  </div>
                </div>
                <div className="border-t-border-strong border-r-border-strong border-b border-b-border-strong border-l-border-strong p-2 md:pl-12 rounded-[16px]">
                  <span className="font-semibold uppercase text-accent text-xs tracking-[0.2em]">
                    02 · Bank statements
                  </span>
                  <h3 className="font-light text-primary text-2xl mt-5">
                    Bring bank activity into view.
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6 mt-4 max-w-md">
                    Import supported CSV bank statements, review imported
                    transactions, and identify potential duplicates where
                    supported.
                  </p>
                  <div className="text-primary text-xs flex mt-7 items-center gap-3">
                    <Upload className="text-accent size-4" />
                    CSV import supported
                  </div>
                </div>
                <div className="border-t-border-strong border-r-border-strong border-b border-b-border-strong border-l-border-strong p-2 md:border-r md:pr-12 rounded-[16px]">
                  <span className="font-semibold uppercase text-accent text-xs tracking-[0.2em]">
                    03 · Reconciliation
                  </span>
                  <h3 className="font-light text-primary text-2xl mt-5">
                    See the match before you confirm it.
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6 mt-4 max-w-md">
                    Review suggested transaction matches, confirm reconciliation
                    manually, and keep transaction history organized.
                  </p>
                  <div className="text-primary text-xs flex mt-7 items-center gap-3">
                    <GitCompareArrows className="text-accent size-4" />
                    Review with context
                  </div>
                </div>
                <div className="border-t-border-strong border-r-border-strong border-b border-b-border-strong border-l-border-strong p-2 md:pl-12 rounded-[16px]">
                  <span className="font-semibold uppercase text-accent text-xs tracking-[0.2em]">
                    04 · GST workspace
                  </span>
                  <h3 className="font-light text-primary text-2xl mt-5">
                    Follow the information that matters.
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6 mt-4 max-w-md">
                    Review supported GST calculations and summaries, view
                    relevant tax information, and export reports where
                    supported.
                  </p>
                  <div className="text-primary text-xs flex mt-7 items-center gap-3">
                    <ReceiptText className="text-accent size-4" />
                    Summaries and exports
                  </div>
                </div>
                <div className="border-t-border-strong border-r-border-strong border-b border-b-border-strong border-l-border-strong p-2 md:border-r md:pr-12 rounded-[16px]">
                  <span className="font-semibold uppercase text-accent text-xs tracking-[0.2em]">
                    05 · Documents
                  </span>
                  <h3 className="font-light text-primary text-2xl mt-5">
                    Keep important files close.
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6 mt-4 max-w-md">
                    Organize business documents, view uploaded files, and keep
                    the records that support your work in one place.
                  </p>
                  <div className="text-primary text-xs flex mt-7 items-center gap-3">
                    <FolderLock className="text-accent size-4" />
                    Private workspace storage
                  </div>
                </div>
                <div className="border-t-border-strong border-r-border-strong border-b border-b-border-strong border-l-border-strong p-2 md:pl-12 rounded-[16px]">
                  <span className="font-semibold uppercase text-accent text-xs tracking-[0.2em]">
                    06 · GNANI assistant
                  </span>
                  <h3 className="font-light text-primary text-2xl mt-5">
                    Ask your business information a better question.
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6 mt-4 max-w-md">
                    When configured, GNANI can help you interact with business
                    information. It is not professional tax or legal advice.
                  </p>
                  <div className="text-primary text-xs flex mt-7 items-center gap-3">
                    <MessageCircle className="text-accent size-4" />
                    Available when configured
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section
            id="solutions"
            className="bg-secondary/25 px-6 py-24 lg:px-10 lg:py-32"
          >
            <div className="mx-auto max-w-7xl">
              <div className="grid gap-12 lg:gap-24 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <p className="font-semibold uppercase text-muted-foreground text-xs tracking-[0.28em]">
                    Solutions
                  </p>
                  <h2 className="font-light text-primary text-4xl leading-tight -tracking-[0.04em] mt-6 sm:text-6xl">
                    Different businesses.
                    <br />
                    <span className="text-accent">
                      The same need for clarity.
                    </span>
                  </h2>
                </div>
                <div className="border-x-border border-t border-t-border border-b-border grid sm:grid-cols-2">
                  <div className="border-t-border border-r-border border-b border-b-border border-l-border py-8 sm:pr-8">
                    <span className="font-medium text-accent text-sm">01</span>
                    <h3 className="font-light text-primary text-xl mt-4">
                      Small businesses and MSMEs
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6 mt-3">
                      Keep invoices, transactions and business records
                      organized.
                    </p>
                  </div>
                  <div className="border-t-border border-r-border border-b border-b-border border-l-border py-8 sm:pl-8">
                    <span className="font-medium text-accent text-sm">02</span>
                    <h3 className="font-light text-primary text-xl mt-4">
                      Retailers and business owners
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6 mt-3">
                      Understand everyday business activity without disconnected
                      spreadsheets.
                    </p>
                  </div>
                  <div className="border-t-border border-r-border border-b border-b-border border-l-border py-8 sm:pr-8">
                    <span className="font-medium text-accent text-sm">03</span>
                    <h3 className="font-light text-primary text-xl mt-4">
                      Accountants and CA professionals
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6 mt-3">
                      Review financial records and GST information in a more
                      organized workspace.
                    </p>
                  </div>
                  <div className="border-t-border border-r-border border-b border-b-border border-l-border py-8 sm:pl-8">
                    <span className="font-medium text-accent text-sm">04</span>
                    <h3 className="font-light text-primary text-xl mt-4">
                      Growing teams
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6 mt-3">
                      Bring business activity into a shared working environment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section id="about" className="px-6 py-24 lg:px-10 lg:py-32">
            <div className="mx-auto max-w-7xl">
              <div className="text-center mx-auto max-w-2xl">
                <p className="font-semibold uppercase text-muted-foreground text-xs tracking-[0.28em]">
                  How DIGITAX works
                </p>
                <h2 className="font-light text-primary text-4xl -tracking-[0.04em] mt-6 sm:text-5xl">
                  A simpler rhythm for the work.
                </h2>
              </div>
              <div className="border-x-border border-y border-y-border grid mt-20 gap-0 md:grid-cols-3">
                <div className="py-10 md:pt-12 md:pr-10">
                  <p className="font-light text-accent text-5xl -tracking-[0.06em]">
                    01
                  </p>
                  <h3 className="font-light text-primary text-2xl mt-8">
                    Set up your business
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6 mt-4">
                    Create your business workspace and configure the relevant
                    business details.
                  </p>
                </div>
                <div className="border-x-border border-t border-t-border border-b-border py-10 md:border-t-0 md:border-l md:px-10 md:pt-12">
                  <p className="font-light text-accent text-5xl -tracking-[0.06em]">
                    02
                  </p>
                  <h3 className="font-light text-primary text-2xl mt-8">
                    Bring in your records
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6 mt-4">
                    Create invoices, import supported bank statements, and
                    organize documents.
                  </p>
                </div>
                <div className="border-x-border border-t border-t-border border-b-border py-10 md:border-t-0 md:border-l md:pt-12 md:pl-10">
                  <p className="font-light text-accent text-5xl -tracking-[0.06em]">
                    03
                  </p>
                  <h3 className="font-light text-primary text-2xl mt-8">
                    Review and understand
                  </h3>
                  <p className="text-muted-foreground text-sm leading-6 mt-4">
                    Explore reconciliation, GST summaries, and business
                    insights.
                  </p>
                </div>
              </div>
            </div>
          </section>
          <section className="bg-[#b7bcc7] border-x-border border-y border-y-border px-6 py-24 lg:px-10 lg:py-32">
            <div className="grid mx-auto gap-14 max-w-7xl lg:items-start lg:gap-24 lg:grid-cols-[0.85fr_1.15fr]">
              <div>
                <p className="font-semibold uppercase text-muted-foreground text-xs tracking-[0.28em]">
                  Carefully considered
                </p>
                <h2 className="font-light text-primary text-4xl leading-tight -tracking-[0.04em] mt-6 sm:text-5xl">
                  Your business information deserves care.
                </h2>
              </div>
              <div>
                <p className="text-muted-foreground text-lg leading-8 max-w-xl">
                  Financial information should be handled with clarity, security
                  and respect.
                </p>
                <div className="grid mt-12 gap-8 sm:grid-cols-2">
                  <div className="border-x-border border-t border-t-border border-b-border pt-5">
                    <LockKeyhole className="text-accent size-5" />
                    <h3 className="font-medium text-primary text-lg mt-5">
                      Private workspaces
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6 mt-2">
                      Business records are organized within the workspace you
                      access through your account.
                    </p>
                  </div>
                  <div className="border-x-border border-t border-t-border border-b-border pt-5">
                    <UsersRound className="text-accent size-5" />
                    <h3 className="font-medium text-primary text-lg mt-5">
                      Access with intention
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6 mt-2">
                      Use the application's configured access controls to manage
                      who can work with business information.
                    </p>
                  </div>
                  <div className="border-x-border border-t border-t-border border-b-border pt-5">
                    <FileLock2 className="text-accent size-5" />
                    <h3 className="font-medium text-primary text-lg mt-5">
                      Documents in context
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6 mt-2">
                      Uploaded files stay connected to the business records they
                      support.
                    </p>
                  </div>
                  <div className="border-x-border border-t border-t-border border-b-border pt-5">
                    <ShieldCheck className="text-accent size-5" />
                    <h3 className="font-medium text-primary text-lg mt-5">
                      Clear, honest product language
                    </h3>
                    <p className="text-muted-foreground text-sm leading-6 mt-2">
                      DIGITAX summaries and exports are not a claim of direct
                      GSTN filing or professional advice.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          <section id="faq" className="px-6 py-24 lg:px-10 lg:py-32">
            <div className="grid mx-auto gap-14 max-w-5xl lg:gap-24 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <p className="font-semibold uppercase text-muted-foreground text-xs tracking-[0.28em]">
                  Questions, answered
                </p>
                <h2 className="font-light text-primary text-4xl -tracking-[0.04em] mt-6 sm:text-5xl">
                  A little more clarity.
                </h2>
                <p className="text-muted-foreground text-sm leading-6 mt-6">
                  A few useful details before you bring your work into DIGITAX.
                </p>
              </div>
              <Accordion
                type="single"
                collapsible={true}
                defaultValue="faq-1"
                className="w-full border-y border-border"
              >
                <AccordionItem
                  value="faq-1"
                  className="border-t border-border last:border-b p-2"
                >
                  <AccordionTrigger
                    className="flex items-center justify-between py-4 text-left text-primary text-sm font-medium hover:no-underline transition-all"
                  >
                    <span>What is DIGITAX?</span>
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-6 pb-5">
                    DIGITAX is a business-finance workspace for organizing
                    invoices, supported bank statement imports, reconciliation,
                    GST summaries, documents and related business information.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq-2"
                  className="border-t border-border last:border-b p-2"
                >
                  <AccordionTrigger
                    className="flex items-center justify-between py-4 text-left text-primary text-sm font-medium hover:no-underline transition-all"
                  >
                    <span>Can I manage invoices with DIGITAX?</span>
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-6 pb-5">
                    Yes. DIGITAX is designed to help you create, manage and
                    follow invoice information across its supported workflow.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq-3"
                  className="border-t border-border last:border-b p-2"
                >
                  <AccordionTrigger
                    className="flex items-center justify-between py-4 text-left text-primary text-sm font-medium hover:no-underline transition-all"
                  >
                    <span>Can I import bank statements?</span>
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-6 pb-5">
                    Supported CSV bank statements can be imported for review.
                    The available format and behavior depend on your workspace
                    configuration.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq-4"
                  className="border-t border-border last:border-b p-2"
                >
                  <AccordionTrigger
                    className="flex items-center justify-between py-4 text-left text-primary text-sm font-medium hover:no-underline transition-all"
                  >
                    <span>Does DIGITAX support GST calculations?</span>
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-6 pb-5">
                    DIGITAX can present supported GST calculations and summaries
                    from business records, with export support where available.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq-5"
                  className="border-t border-border last:border-b p-2"
                >
                  <AccordionTrigger
                    className="flex items-center justify-between py-4 text-left text-primary text-sm font-medium hover:no-underline transition-all"
                  >
                    <span>Does DIGITAX directly file GST returns with GSTN?</span>
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-6 pb-5">
                    No direct GSTN filing is represented here. GST summaries and
                    exports are not the same as filing returns directly with
                    GSTN.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq-6"
                  className="border-t border-border last:border-b p-2"
                >
                  <AccordionTrigger
                    className="flex items-center justify-between py-4 text-left text-primary text-sm font-medium hover:no-underline transition-all"
                  >
                    <span>Can I use DIGITAX for multiple businesses?</span>
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-6 pb-5">
                    This depends on the account and workspace configuration
                    available to you. Sign in or get started to see the options
                    for your setup.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq-7"
                  className="border-t border-border last:border-b p-2"
                >
                  <AccordionTrigger
                    className="flex items-center justify-between py-4 text-left text-primary text-sm font-medium hover:no-underline transition-all"
                  >
                    <span>Is the GNANI AI assistant available?</span>
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-6 pb-5">
                    GNANI is available when configured for the workspace. It
                    helps users interact with business information and does not
                    provide professional tax or legal advice.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq-8"
                  className="border-t border-border last:border-b p-2"
                >
                  <AccordionTrigger
                    className="flex items-center justify-between py-4 text-left text-primary text-sm font-medium hover:no-underline transition-all"
                  >
                    <span>How are my documents handled?</span>
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-6 pb-5">
                    Documents are organized in the business workspace and
                    handled according to the application's configured access and
                    storage behavior.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem
                  value="faq-9"
                  className="border-t border-border last:border-b p-2"
                >
                  <AccordionTrigger
                    className="flex items-center justify-between py-4 text-left text-primary text-sm font-medium hover:no-underline transition-all"
                  >
                    <span>Can I try DIGITAX?</span>
                    <ChevronDown className="size-4 transition-transform duration-200" />
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-6 pb-5">
                    Use Get started to create an account through the existing
                    registration flow, or sign in if you already have access.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </section>
          <section className="bg-primary text-primary-foreground px-6 py-24 lg:px-10 lg:py-32">
            <div className="flex mx-auto flex-col justify-between items-start gap-12 max-w-7xl lg:flex-row lg:items-end">
              <div>
                <p className="font-semibold uppercase text-accent text-xs tracking-[0.28em]">
                  Start with what matters
                </p>
                <h2 className="font-light text-5xl leading-[1.05] tracking-tighter mt-6 max-w-3xl sm:text-7xl">
                  A clearer next step.
                  <br />
                  <span className="text-accent">For your business.</span>
                </h2>
                <p className="text-primary-foreground/70 text-base leading-7 mt-7 max-w-xl">
                  Bring your business records into one workspace and see what
                  DIGITAX can help you organize.
                </p>
              </div>
              <div className="flex flex-col gap-4 w-full sm:flex-row sm:w-auto">
                <a
                  href="/register"
                  className="font-semibold transition-transform rounded-md bg-accent text-accent-foreground text-sm inline-flex px-6 py-3.5 justify-center items-center gap-2 hover:-translate-y-0.5"
                >
                  Get started
                  <ArrowUpRight className="size-4" />
                </a>
                <a
                  href="/login"
                  className="font-medium transition-colors rounded-md text-primary-foreground text-sm border border-primary-foreground/25 inline-flex px-6 py-3.5 justify-center items-center gap-2 hover:text-accent hover:border-accent"
                >
                  Sign in
                  <ArrowRight className="size-4" />
                </a>
              </div>
            </div>
          </section>
          <footer className="bg-black text-white px-6 pb-10 lg:px-10">
            <div className="border-x-white/15 border-t border-t-white/15 border-b-white/15 mx-auto pt-14 max-w-7xl">
              <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_0.8fr_0.8fr]">
                <div>
                  <div className="flex items-center gap-3">
                    <img
                      src="/logo.svg"
                      alt="DIGITAX logo mark"
                      className="rounded-md size-9 object-cover [filter:invert(1)]"
                    />
                    <span className="font-semibold text-lg tracking-[0.18em]">
                      DIGITAX
                    </span>
                  </div>
                  <p className="text-white/60 text-sm leading-6 mt-6 max-w-xs">
                    More clarity for the business you’re building.
                  </p>
                </div>
                <div>
                  <p className="font-semibold uppercase text-white text-xs tracking-[0.2em]">
                    Product
                  </p>
                  <div className="flex mt-5 flex-col gap-3">
                    <a
                      href="#product"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Dashboard
                    </a>
                    <a
                      href="#features"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Invoices
                    </a>
                    <a
                      href="#gst-tools"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Transactions
                    </a>
                    <a
                      href="#gst-tools"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Reconciliation
                    </a>
                    <a
                      href="#gst-tools"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      GST
                    </a>
                    <a
                      href="#features"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Documents
                    </a>
                  </div>
                </div>
                <div>
                  <p className="font-semibold uppercase text-white text-xs tracking-[0.2em]">
                    Explore
                  </p>
                  <div className="flex mt-5 flex-col gap-3">
                    <a
                      href="#features"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Features
                    </a>
                    <a
                      href="#solutions"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Solutions
                    </a>
                    <a
                      href="#about"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      About
                    </a>
                    <a
                      href="#top"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Contact
                    </a>
                  </div>
                </div>
                <div>
                  <p className="font-semibold uppercase text-white text-xs tracking-[0.2em]">
                    Account
                  </p>
                  <div className="flex mt-5 flex-col gap-3">
                    <a
                      href="/login"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Login
                    </a>
                    <a
                      href="/register"
                      className="text-white/60 text-sm hover:text-white"
                    >
                      Sign up
                    </a>
                  </div>
                </div>
                <div>
                  <p className="font-semibold uppercase text-white text-xs tracking-[0.2em]">
                    Legal
                  </p>
                  <div className="flex mt-5 flex-col gap-3">
                    <span className="text-white/45 text-sm">
                      Privacy policy
                    </span>
                    <span className="text-white/45 text-sm">
                      Terms of service
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-white/45 text-xs border-x-white/15 border-t border-t-white/15 border-b-white/15 flex mt-16 pt-6 flex-col justify-between gap-4 sm:flex-row">
                <span>© 2024 DIGITAX. Illustrative product content.</span>
                <span>Built for clearer business decisions.</span>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}

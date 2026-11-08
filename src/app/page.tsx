'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BadgeCheck,
  FileCheck2,
  Landmark,
  LockKeyhole,
  ReceiptText,
  RefreshCw,
  ThumbsUp,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChartContainer, ChartTooltip } from '@/components/ui/chart';
import {
  Area,
  AreaChart as RechartsAreaChart,
  CartesianGrid,
  XAxis,
} from 'recharts';

export default function DIGITAXLanding() {
  return (
    <div data-appearance="light">
      <div className="bg-background text-foreground w-full h-fit min-h-screen w-screen min-w-screen max-w-screen overflow-visible">
        <header className="bg-background border-t border-r border-b border-b-border border-l-border w-full">
          <div className="flex mx-auto px-6 justify-between items-center w-full h-16 max-w-7xl">
            <Link href="/" className="font-bold text-foreground text-lg tracking-tight">
              DIGITAX
            </Link>
            <nav
              aria-label="Primary navigation"
              className="flex items-center gap-7"
            >
              <a
                href="#product"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                Product
              </a>
              <a
                href="#gst-compliance"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                GST compliance
              </a>
              <a
                href="#pricing"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                Pricing
              </a>
              <a
                href="#resources"
                className="font-medium text-foreground text-sm hover:text-primary"
              >
                Resources
              </a>
            </nav>
            <div className="flex items-center gap-3">
              <a
                href="/sign-in"
                className="font-semibold rounded-md text-foreground text-sm border border-border px-4 py-2 hover:bg-accent"
              >
                Sign in
              </a>
              <Link
                href="/register"
                className="font-semibold rounded-md bg-primary text-primary-foreground text-sm px-4 py-2 hover:bg-primary/90"
              >
                Get started
              </Link>
            </div>
          </div>
        </header>
        <main>
          <section className="flex mx-auto px-6 pt-12 pb-16 flex-col items-center w-full max-w-7xl">
            <div className="font-medium rounded-full bg-primary/10 text-primary text-sm border border-primary/20 flex px-4 py-2 items-center gap-2">
              <span className="rounded-full bg-primary size-2" />
              <span>Now with automated GST reconciliation</span>
            </div>
            <div className="grid mt-12 items-center gap-12 grid-cols-2 w-full">
              <div className="max-w-xl">
                <p className="font-semibold text-primary text-sm tracking-[0.2em]">
                  FINANCE, WITHOUT THE FRICTION
                </p>
                <h1 className="font-semibold text-foreground text-5xl leading-tight tracking-tight mt-5">
                  Your books, finally in
                  <span className="text-primary">sync.</span>
                </h1>
                <p className="text-muted-foreground text-lg leading-8 mt-6 max-w-lg">
                  DIGITAX brings bookkeeping, GST compliance, banking, and
                  reporting into one calm workspace for modern Indian
                  businesses.
                </p>
                <div className="flex mt-8 items-center gap-3">
                  <Button className="px-6 h-11">Start free</Button>
                  <Button variant="outline" className="px-6 gap-2 h-11">
                    See how it works
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
                <p className="text-muted-foreground text-sm mt-4">
                  No credit card required · Set up in 10 minutes
                </p>
              </div>
              <Card className="shadow-md border-border overflow-hidden">
                <div className="border-t border-r border-b border-b-border border-l-border flex px-6 py-5 justify-between items-center">
                  <div>
                    <h2 className="font-semibold text-card-foreground">
                      June 2024 overview
                    </h2>
                    <p className="text-muted-foreground text-xs mt-1">
                      Sample workspace data
                    </p>
                  </div>
                  <Badge className="bg-primary/10 text-primary">
                    Live workspace
                  </Badge>
                </div>
                <div className="grid p-6 gap-3 grid-cols-3">
                  <div className="rounded-lg bg-muted border border-border p-4">
                    <p className="text-muted-foreground text-xs">Revenue</p>
                    <p className="font-semibold text-card-foreground text-lg mt-2">
                      ₹18,42,600
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted border border-border p-4">
                    <p className="text-muted-foreground text-xs">GST payable</p>
                    <p className="font-semibold text-card-foreground text-lg mt-2">
                      ₹2,84,760
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted border border-border p-4">
                    <p className="text-muted-foreground text-xs">
                      Cash balance
                    </p>
                    <p className="font-semibold text-card-foreground text-lg mt-2">
                      ₹9,68,410
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <div className="flex mb-3 justify-between items-center">
                    <p className="font-semibold text-card-foreground text-sm">
                      Cash flow
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Jun 01 – Jun 30
                    </p>
                  </div>
                  <ChartContainer
                    config={{
                      expenses: {
                        color: "var(--color-chart-2)",
                        label: "Expenses",
                      },
                      revenue: {
                        color: "var(--color-chart-1)",
                        label: "Revenue",
                      },
                    }}
                    className="w-full h-40"
                  >
                    <RechartsAreaChart
                      data={[
                        { day: "01", expenses: 240, revenue: 420 },
                        { day: "06", expenses: 310, revenue: 560 },
                        { day: "11", expenses: 280, revenue: 480 },
                        { day: "16", expenses: 390, revenue: 720 },
                        { day: "21", expenses: 360, revenue: 650 },
                        { day: "26", expenses: 430, revenue: 840 },
                        { day: "30", expenses: 410, revenue: 780 },
                      ]}
                    >
                      <CartesianGrid
                        stroke="var(--color-border)"
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="day"
                        tick={{
                          fill: "var(--color-muted-foreground)",
                          fontSize: 11,
                        }}
                        tickLine={false}
                        tickMargin={8}
                      />
                      <ChartTooltip />
                      <Area
                        dataKey="revenue"
                        fill="var(--color-chart-1)"
                        fillOpacity={0.18}
                        stroke="var(--color-chart-1)"
                        strokeWidth={2}
                        type="monotone"
                      />
                      <Area
                        dataKey="expenses"
                        fill="var(--color-chart-2)"
                        fillOpacity={0.1}
                        stroke="var(--color-chart-2)"
                        strokeWidth={2}
                        type="monotone"
                      />
                    </RechartsAreaChart>
                  </ChartContainer>
                </div>
              </Card>
            </div>
          </section>
          <section className="bg-background border-x border-y border-y-border px-6 py-10">
            <div className="mx-auto w-full max-w-7xl">
              <p className="font-medium text-center text-muted-foreground text-sm">
                Built for the way Indian businesses move
              </p>
              <div className="grid mt-7 gap-6 grid-cols-4">
                <div className="font-medium text-foreground text-sm flex justify-center items-center gap-3">
                  <BadgeCheck className="text-primary size-5" />
                  GST-ready
                </div>
                <div className="font-medium text-foreground text-sm flex justify-center items-center gap-3">
                  <Landmark className="text-primary size-5" />
                  Bank-connected
                </div>
                <div className="font-medium text-foreground text-sm flex justify-center items-center gap-3">
                  <ThumbsUp className="text-primary size-5" />
                  Accountant-approved
                </div>
                <div className="font-medium text-foreground text-sm flex justify-center items-center gap-3">
                  <LockKeyhole className="text-primary size-5" />
                  Secure by design
                </div>
              </div>
            </div>
          </section>
          <section className="bg-secondary px-6 py-16">
            <div className="grid mx-auto gap-16 grid-cols-2 w-full max-w-7xl">
              <div className="max-w-lg">
                <h2 className="font-semibold text-secondary-foreground text-3xl leading-tight tracking-tight">
                  From transaction to tax return, without the spreadsheet maze.
                </h2>
                <p className="text-muted-foreground text-base leading-7 mt-5">
                  Bring every financial movement into one connected workspace,
                  so your team can spend less time chasing numbers and more time
                  moving the business forward.
                </p>
              </div>
              <div className="flex flex-col">
                <div className="border-t border-r border-b border-b-border border-l-border flex py-4 items-start gap-4 first:pt-0">
                  <ReceiptText className="text-primary mt-1 size-5" />
                  <div>
                    <h3 className="font-semibold text-secondary-foreground">
                      Capture every transaction
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Keep sales, purchases, and expenses organised from day
                      one.
                    </p>
                  </div>
                </div>
                <div className="border-t border-r border-b border-b-border border-l-border flex py-4 items-start gap-4">
                  <RefreshCw className="text-primary mt-1 size-5" />
                  <div>
                    <h3 className="font-semibold text-secondary-foreground">
                      Match your bank automatically
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Reconcile payments and deposits without manual follow-up.
                    </p>
                  </div>
                </div>
                <div className="flex pt-4 pb-0 items-start gap-4">
                  <FileCheck2 className="text-primary mt-1 size-5" />
                  <div>
                    <h3 className="font-semibold text-secondary-foreground">
                      File with confidence
                    </h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Know your GST position before every return is submitted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
        <footer className="bg-foreground text-background px-6 py-10">
          <div className="flex mx-auto justify-between items-end w-full max-w-7xl">
            <div>
              <p className="font-bold text-lg tracking-tight">DIGITAX</p>
              <p className="text-background/70 text-sm mt-3">
                Financial clarity for ambitious teams.
              </p>
            </div>
            <div className="text-background/80 text-sm flex items-center gap-7">
              <a href="#product" className="hover:text-background">
                Product
              </a>
              <a href="#gst-compliance" className="hover:text-background">
                GST compliance
              </a>
              <a href="#pricing" className="hover:text-background">
                Pricing
              </a>
            </div>
            <p className="text-background/60 text-sm">© 2024 DIGITAX</p>
          </div>
        </footer>
      </div>
    </div>
  );
}


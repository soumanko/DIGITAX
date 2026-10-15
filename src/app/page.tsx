'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/layout/marketing-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  ArrowLeftRight,
  Calculator,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  Zap,
  Globe2,
  Layers,
  Lock,
  Mic
} from 'lucide-react';

export default function HomePage() {
  const handleDemoAccess = () => {
    // Set demo session cookie for direct test access
    document.cookie = 'digitax_demo_session=true; path=/; max-age=86400; SameSite=Lax';
    window.location.href = '/dashboard';
  };

  return (
    <MarketingLayout>
      {/* Product Boundary Trust Banner */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-2.5 px-4 text-center text-xs font-medium text-amber-800 dark:text-amber-300">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <strong>Regulatory Transparency:</strong> DIGITAX is an intelligent bookkeeping & return-preparation copilot. It prepares reviewable audit-ready summaries; human tax professionals retain final filing oversight.
        </span>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-gradient-to-b from-surface via-surface to-surface-secondary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 dark:bg-primary-950/60 border border-primary-200 dark:border-primary-800 text-xs font-semibold text-primary-700 dark:text-primary-300 shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
              <span>Next-Gen GST Intelligence for Bharat</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight leading-[1.15]">
              Stress-Free GST Bookkeeping for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-emerald-600">
                Kiranas & Retailers
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary leading-relaxed max-w-2xl mx-auto">
              Snap physical purchase bills, reconcile bank UPI statements in seconds, detect missing input tax credits, and generate GSTR-1 and GSTR-3B drafts without calculation headache.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto text-base px-8 h-12 shadow-md hover:shadow-lg">
                  Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <button
                onClick={handleDemoAccess}
                className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-lg text-sm font-semibold border border-primary-300 dark:border-primary-700 bg-surface hover:bg-surface-tertiary text-primary-700 dark:text-primary-300 transition-colors shadow-xs"
              >
                <Zap className="h-4 w-4 mr-2 text-primary-600" />
                Explore Live Interactive Demo
              </button>
            </div>

            {/* Language Support Highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-text-secondary">
              <span className="font-semibold text-text-primary flex items-center gap-1">
                <Globe2 className="h-3.5 w-3.5 text-primary-600" /> Indic Voice & Text:
              </span>
              <span className="bg-surface px-2.5 py-1 rounded-md border border-border">English</span>
              <span className="bg-surface px-2.5 py-1 rounded-md border border-border">हिंदी (Hindi)</span>
              <span className="bg-surface px-2.5 py-1 rounded-md border border-border">বাংলা (Bengali)</span>
              <span className="bg-surface px-2.5 py-1 rounded-md border border-border">मराठी (Marathi)</span>
            </div>
          </div>

          {/* Interactive Hero Showcase Preview */}
          <div className="mt-14 max-w-5xl mx-auto">
            <div className="relative rounded-2xl border border-border/80 bg-surface shadow-2xl p-4 sm:p-6 lg:p-8 overflow-hidden">
              <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Mock Dashboard Banner */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-6 mb-6 border-b border-border gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Active Shop: Shree Krishna Traders</span>
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mt-1">October 2026 Filing Readiness Center</h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">98.4% Matched</Badge>
                  <Badge variant="outline">GSTR-3B Draft Ready</Badge>
                </div>
              </div>

              {/* Grid of Preview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Card 1: OCR Extraction with Confidence */}
                <Card className="bg-surface-secondary/50 border border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-secondary uppercase">Recent Document</span>
                      <Badge variant="accent">94% Confidence</Badge>
                    </div>
                    <CardTitle className="text-sm font-bold mt-1">Invoice #INV-2026-881</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">Vendor</span>
                      <span className="font-medium text-text-primary">Apex FMCG Wholesale</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">GSTIN</span>
                      <span className="font-mono text-text-primary">27AABCA1234F1Z5</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">Taxable Amt</span>
                      <span className="font-semibold text-text-primary">₹1,45,200.00</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-text-secondary">Calculated Tax</span>
                      <span className="font-bold text-primary-600">₹26,136.00 (18%)</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 2: Automatic Bank Reconciliation */}
                <Card className="bg-surface-secondary/50 border border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-secondary uppercase">Reconciliation</span>
                      <Badge variant="success">Auto-Matched</Badge>
                    </div>
                    <CardTitle className="text-sm font-bold mt-1">HDFC Bank UPI / NEFT</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">Bank Ref</span>
                      <span className="font-mono text-text-primary">UPI/329048/Apex</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">Txn Amount</span>
                      <span className="font-medium text-text-primary">₹1,71,336.00</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/40">
                      <span className="text-text-secondary">Invoice Balance</span>
                      <span className="font-semibold text-emerald-600">₹0.00 (Settled)</span>
                    </div>
                    <div className="flex justify-between pt-1">
                      <span className="text-text-secondary">Difference</span>
                      <span className="font-medium text-text-primary">₹0.00 exact</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3: AI Copilot Insights */}
                <Card className="bg-surface-secondary/50 border border-border/60">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-text-secondary uppercase">AI Tax Advisor</span>
                      <Badge variant="secondary">Gnani EVON V3.3</Badge>
                    </div>
                    <CardTitle className="text-sm font-bold mt-1 flex items-center gap-1.5">
                      <Mic className="h-4 w-4 text-primary-600" /> Indic Voice Copilot
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <p className="bg-primary-50 dark:bg-primary-950/40 p-2.5 rounded-lg text-primary-800 dark:text-primary-300 leading-relaxed italic">
                      &quot;आपने 3 सप्लायर बिलों पर ₹18,400 का इनपुट टैक्स क्रेडिट (ITC) क्लेम किया है। सभी GSTIN सक्रिय हैं।&quot;
                    </p>
                    <div className="flex items-center gap-1.5 text-text-secondary pt-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Ready for human CA review</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-extrabold text-text-primary tracking-tight">
              Built for the Complexities of Indian Small Business
            </h2>
            <p className="mt-3 text-base text-text-secondary">
              Everything you need to transform a shoe-box of paper receipts and phone UPI alerts into clean, audit-ready bookkeeping.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1 */}
            <div className="rounded-xl border border-border p-6 bg-surface-secondary/30 hover:border-primary-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-600 mb-4">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Automated OCR & Extraction</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Scan faded thermal receipts or multi-line vendor tax invoices. Extracts GSTINs, HSN codes, taxable values, and SGST/CGST/IGST splits with confidence scoring.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-border p-6 bg-surface-secondary/30 hover:border-primary-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 mb-4">
                <ArrowLeftRight className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Multi-Method Bank Matching</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Reconcile bank statements, UPI QR payments, and cash deposits against outstanding invoices. Handles split payments, partial clearings, and discounts.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-border p-6 bg-surface-secondary/30 hover:border-primary-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 mb-4">
                <Calculator className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Deterministic GST Engine</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Zero rounding errors using arbitrary precision arithmetic. Accurately maps B2B vs. B2CL vs. B2CS, checks reverse charge mechanisms, and computes eligible ITC.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-border p-6 bg-surface-secondary/30 hover:border-primary-500/50 transition-all">
              <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 mb-4">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Multilingual Voice Copilot</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Powered by GNANI EVON V3.3 & PRISMA/TIMBRE voice models. Ask your ledger questions in Hindi, Marathi, Bengali, or English and receive clear, cited answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Safety & Compliance Section */}
      <section className="py-16 bg-surface-secondary border-t border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-surface border border-border text-primary-600">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary">Multi-Tenant Isolation</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Enforced at the database row level (RLS). Every shop has isolated document storage and encrypted financial records.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-surface border border-border text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary">Human-in-the-Loop Audit</h4>
                <p className="text-sm text-text-secondary mt-1">
                  Every extraction correction, manual re-classification, or invoice update is timestamped and recorded with an immutable audit trail.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-surface border border-border text-amber-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-text-primary">No Direct Government Portal Writes</h4>
                <p className="text-sm text-text-secondary mt-1">
                  We generate certified, error-checked GSTR JSON/CSV exports for filing review by you or your Chartered Accountant.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Take the Chaos Out of Your GST Filing?
          </h2>
          <p className="text-lg text-primary-200 max-w-2xl mx-auto">
            Join thousands of modern Indian merchants running seamless bookkeeping with automated invoice capture and instant reconciliation.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto bg-white text-primary-900 hover:bg-zinc-100 font-bold px-8 h-12 shadow-lg">
                Create Free Shop Account
              </Button>
            </Link>
            <button
              onClick={handleDemoAccess}
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-6 rounded-lg text-sm font-semibold border border-primary-400 bg-primary-800/40 hover:bg-primary-800 text-white transition-colors"
            >
              Open Instant Demo
            </button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

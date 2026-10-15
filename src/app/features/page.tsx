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
  Lock,
  Layers,
  HelpCircle,
  FileCheck2,
  Mic
} from 'lucide-react';

export default function FeaturesPage() {
  return (
    <MarketingLayout>
      <div className="py-16 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="primary">Comprehensive GST Copilot</Badge>
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
              Powerful Capabilities Engineered for Indian Kirana & Retail Commerce
            </h1>
            <p className="text-base text-text-secondary leading-relaxed">
              From paper bills on your counter to verified GSTR-1 and GSTR-3B audit drafts ready for your Chartered Accountant.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1 */}
            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-2">
                  <FileText className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">Document & Invoice OCR</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  High-accuracy image recognition for thermal paper bills and PDF invoices. Extracts vendor GSTIN, invoice date, HSN codes, and exact CGST/SGST/IGST tax splits.
                </p>
                <div className="font-semibold text-primary-700">✓ Line-item arithmetic check with ₹1 rounding tolerance</div>
              </CardContent>
            </Card>

            {/* 2 */}
            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <ArrowLeftRight className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">Smart Bank & UPI Matching</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  Automatically matches HDFC, SBI, ICICI, and PhonePe QR settlements against outstanding invoices using fuzzy dates, exact amounts, and UTR narration search.
                </p>
                <div className="font-semibold text-emerald-700">✓ Multi-invoice split allocations and partial settlements</div>
              </CardContent>
            </Card>

            {/* 3 */}
            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                  <Calculator className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">Deterministic GST Engine</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  Built with arbitrary-precision decimal mathematics to prevent floating-point calculation errors. Generates GSTR-1 Tables 4 & 7 and GSTR-3B Tables 3.1 & 4.
                </p>
                <div className="font-semibold text-amber-700">✓ Exact ITC offset against outward liability</div>
              </CardContent>
            </Card>

            {/* 4 */}
            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                  <Mic className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">Indic Voice Assistant</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  Powered by GNANI EVON V3.3 & PRISMA/TIMBRE voice models. Speak naturally in Hindi, Marathi, Bengali, or English to check cashflow, ITC balance, and return deadlines.
                </p>
                <div className="font-semibold text-purple-700">✓ Native Indian speech recognition & synthesis</div>
              </CardContent>
            </Card>

            {/* 5 */}
            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">Human-in-the-Loop Review</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  Low-confidence extractions and unverified HSN categories are flagged for manual verification before any returns are finalized, keeping you 100% compliant.
                </p>
                <div className="font-semibold text-blue-700">✓ Immutable audit trail for every change</div>
              </CardContent>
            </Card>

            {/* 6 */}
            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-teal-100 text-teal-600 flex items-center justify-center mb-2">
                  <FileCheck2 className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">Certified CA Audit Packages</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  Export return summaries as official GST Offline Tool JSON files and printable audit dossiers designed specifically for your Chartered Accountant.
                </p>
                <div className="font-semibold text-teal-700">✓ Zero direct portal writes — human stays in control</div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-16 text-center">
            <Link href="/register">
              <Button size="lg" className="px-8 shadow-md">
                Try DIGITAX Free Today <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

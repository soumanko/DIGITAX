'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/layout/marketing-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  UploadCloud,
  Cpu,
  ArrowLeftRight,
  Calculator,
  Download,
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Snap Bills & Invoices',
    desc: 'Take photos of purchase bills from your distributors (Apex, HUL, Britannia) or upload PDF vendor invoices. Our OCR extracts line items, HSNs, and GSTINs automatically.',
    icon: UploadCloud,
    badge: 'OCR & Vision AI',
  },
  {
    step: '02',
    title: 'Sync UPI & Bank Statements',
    desc: 'Import your weekly or monthly HDFC, SBI, or PhonePe merchant settlement statements. Our heuristic engine matches payments to outstanding bills in seconds.',
    icon: ArrowLeftRight,
    badge: 'Auto-Reconciliation',
  },
  {
    step: '03',
    title: 'Deterministic GST Calculations',
    desc: 'Zero math errors. Our GST engine splits CGST, SGST, and IGST, validates state place-of-supply codes, and calculates eligible Input Tax Credit (ITC).',
    icon: Calculator,
    badge: 'Exact Arithmetic',
  },
  {
    step: '04',
    title: 'Review & Share with your CA',
    desc: 'Human oversight first. Review any flagged items in our Review Center, then download GSTR-1 JSON and GSTR-3B audit summaries for your Chartered Accountant.',
    icon: Download,
    badge: 'Audit Ready',
  },
];

export default function HowItWorksPage() {
  return (
    <MarketingLayout>
      <div className="py-16 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="primary">Simple 4-Step Workflow</Badge>
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
              From Counter Bills to Audit-Ready GST Filing
            </h1>
            <p className="text-base text-text-secondary leading-relaxed">
              Designed to fit naturally into the daily routine of a busy shop owner, cashier, or store manager.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, idx) => (
              <Card key={idx} className="relative border-border overflow-hidden">
                <div className="absolute top-3 right-4 font-extrabold text-3xl text-primary-200 dark:text-primary-950">
                  {item.step}
                </div>
                <CardHeader>
                  <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-2">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className="w-fit text-[10px] mb-2">
                    {item.badge}
                  </Badge>
                  <CardTitle className="text-base font-bold text-text-primary">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-text-secondary leading-relaxed">
                  {item.desc}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 p-6 rounded-2xl bg-surface-secondary border border-border text-center max-w-2xl mx-auto space-y-4">
            <h3 className="text-lg font-bold text-text-primary">Ready to streamline your shop bookkeeping?</h3>
            <p className="text-xs text-text-secondary">
              Set up in less than 2 minutes. No complex accounting knowledge required.
            </p>
            <Link href="/register">
              <Button size="lg" className="px-8 shadow-md">
                Get Started Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

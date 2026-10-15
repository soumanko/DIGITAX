'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/layout/marketing-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, HelpCircle, ArrowRight } from 'lucide-react';

const faqs = [
  {
    q: 'Does DIGITAX file my GST return directly on the GST portal?',
    a: 'No. DIGITAX is an intelligent bookkeeping and return preparation copilot. It extracts invoices, reconciles bank statements, and calculates exact GSTR-1 and GSTR-3B values. You or your Chartered Accountant download certified JSON/CSV files and review them before submitting on the official GST portal.',
  },
  {
    q: 'Can DIGITAX read faded thermal receipts and handwritten purchase bills?',
    a: 'Yes. Our OCR engine is calibrated for Indian retail documents, including thermal bills from FMCG distributors and photo captures from smartphone cameras. Items with lower clarity are routed to the Human Review Center for quick one-click confirmation.',
  },
  {
    q: 'Which Indic languages are supported by the AI Assistant?',
    a: 'Powered by GNANI EVON V3.3 and PRISMA/TIMBRE voice models, DIGITAX supports voice and text queries in Hindi (हिंदी), Marathi (मराठी), Bengali (বাংলা), and Indian English.',
  },
  {
    q: 'How does DIGITAX reconcile UPI QR payments like PhonePe and Google Pay?',
    a: 'When you import your bank statement or UPI settlement CSV, our heuristic engine searches for matching invoice amounts, customer names, UPI IDs, and date proximity to automatically link payments to invoices.',
  },
  {
    q: 'Is my shop financial data isolated from other businesses?',
    a: 'Absolutely. We enforce database Row Level Security (RLS) on PostgreSQL. Each shop has completely isolated records, documents, and ledger transactions, preventing any cross-tenant data access.',
  },
  {
    q: 'What if my shop is under the Composition Scheme or Unregistered?',
    a: 'DIGITAX supports Regular, Composition, and QRMP taxpayer schemes. You can configure your scheme in Shop Settings, and the platform will adjust tax calculations and return formats accordingly.',
  },
];

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <MarketingLayout>
      <div className="py-16 md:py-24 bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="primary">Frequently Asked Questions</Badge>
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
              Everything You Need to Know About DIGITAX
            </h1>
            <p className="text-base text-text-secondary leading-relaxed">
              Clear answers regarding GST compliance, voice assistance, reconciliation, and data security.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <Card
                  key={idx}
                  className="border-border cursor-pointer transition-colors hover:border-primary-500/50"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                >
                  <CardHeader className="py-4 px-5">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm sm:text-base font-bold text-text-primary">
                        {faq.q}
                      </CardTitle>
                      {isOpen ? (
                        <ChevronUp className="h-4 w-4 text-primary-600 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-text-tertiary shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  {isOpen && (
                    <CardContent className="px-5 pb-5 pt-0 text-xs sm:text-sm text-text-secondary leading-relaxed border-t border-border/40 mt-2">
                      {faq.a}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <p className="text-sm text-text-secondary mb-4">Still have questions?</p>
            <Link href="/register">
              <Button size="lg" className="px-8 shadow-md">
                Try the Interactive Demo Free <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

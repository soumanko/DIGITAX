'use client';

import React from 'react';
import Link from 'next/link';
import { MarketingLayout } from '@/components/layout/marketing-layout';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Lock,
  ShieldCheck,
  CheckCircle2,
  FileKey,
  Server,
  EyeOff,
  UserCheck,
  History
} from 'lucide-react';

export default function SecurityPage() {
  return (
    <MarketingLayout>
      <div className="py-16 md:py-24 bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
            <Badge variant="success">Institutional-Grade Protection</Badge>
            <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
              Security, Tenant Isolation & Regulatory Boundaries
            </h1>
            <p className="text-base text-text-secondary leading-relaxed">
              We treat your shop financial ledgers, purchase costs, and supplier data with the highest cryptographic standards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-2">
                  <Lock className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">Multi-Tenant Row Level Security (RLS)</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  Every shop profile, document image, invoice record, and transaction has an immutable <code>shop_id</code> tenant tag. Supabase RLS policies enforce that users can only ever access data belonging to their verified shop membership.
                </p>
                <div className="font-semibold text-emerald-700">✓ Enforced at the PostgreSQL engine layer</div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mb-2">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">No Direct Government Portal Writes</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  DIGITAX strictly acts as an intelligent preparation and bookkeeping copilot. We never hold your government GST portal passwords or auto-submit tax returns without explicit human practitioner oversight.
                </p>
                <div className="font-semibold text-primary-700">✓ Human Chartered Accountant stays in control</div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                  <FileKey className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">End-to-End Encryption</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  All data in transit is encrypted using modern TLS 1.3 with strict HTTP Strict Transport Security (HSTS). All document storage buckets are encrypted at rest with AES-256.
                </p>
                <div className="font-semibold text-purple-700">✓ Bank-grade document vaulting</div>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center mb-2">
                  <History className="h-5 w-5" />
                </div>
                <CardTitle className="text-lg font-bold">Immutable Audit Logging</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-text-secondary leading-relaxed space-y-2">
                <p>
                  Every manual edit, invoice confirmation, and reconciliation match generates a tamper-evident audit record with timestamp, user ID, and previous vs. new values.
                </p>
                <div className="font-semibold text-amber-700">✓ Ready for tax department audits</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MarketingLayout>
  );
}

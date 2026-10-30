'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  ShieldCheck,
  CheckCircle2,
  Building2,
  FileCheck,
  ArrowRight,
  Info
} from 'lucide-react';

const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '21', name: 'Odisha' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isGstRegistered, setIsGstRegistered] = useState(true);
  const [gstin, setGstin] = useState('27AABCS1429B1ZB');
  const [businessName, setBusinessName] = useState('Shree Krishna Traders');
  const [businessType, setBusinessType] = useState('Kirana & FMCG Retail');
  const [stateCode, setStateCode] = useState('27');
  const [city, setCity] = useState('Mumbai');
  const [pincode, setPincode] = useState('400001');
  const [taxpayerScheme, setTaxpayerScheme] = useState<'regular' | 'composition_goods' | 'qrmp'>('regular');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGstinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setGstin(val);
    if (val.length >= 2) {
      const code = val.slice(0, 2);
      const match = INDIAN_STATES.find(s => s.code === code);
      if (match) {
        setStateCode(code);
      }
    }
  };

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const stateObj = INDIAN_STATES.find(s => s.code === stateCode);
    const shopPayload = {
      name: businessName,
      gstin: isGstRegistered ? gstin.trim() : null,
      business_type: businessType,
      state_code: stateCode,
      state: stateObj?.name || 'Maharashtra',
      city,
      pincode,
      taxpayer_scheme: taxpayerScheme,
    };

    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopPayload),
      });

      const data = await res.json();

      if (!res.ok) {
        // If unauthenticated or demo session in dev, fall back gracefully to local dev preview
        if (res.status === 401 && typeof window !== 'undefined') {
          const isDemo = document.cookie.includes('digitax_demo_session=true');
          if (isDemo) {
            localStorage.setItem('digitax_active_shop', JSON.stringify({ ...shopPayload, id: 'shop-demo-001', onboarding_completed: true }));
            router.push('/dashboard');
            return;
          }
        }
        setError(data.error || 'Failed to save shop profile. Please verify your inputs.');
        setLoading(false);
        return;
      }

      // Persist active shop ID for fast client caching
      if (typeof window !== 'undefined' && data.shop) {
        localStorage.setItem('digitax_active_shop', JSON.stringify(data.shop));
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err?.message || 'Network error saving shop profile. Please check your connection.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-secondary py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      <div className="max-w-xl mx-auto w-full">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-primary-600 items-center justify-center text-white font-bold text-xl mb-3 shadow-md">
            D
          </div>
          <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
            Configure Your Shop Profile
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            DIGITAX customizes your GST tax rules, ITC calculations, and invoice numbering based on your state.
          </p>
        </div>

        <Card className="border-border shadow-xl">
          <CardHeader className="border-b border-border bg-surface/50 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Business & Tax Details</CardTitle>
                <CardDescription className="text-xs">Step 1 of 1: Shop Settings</CardDescription>
              </div>
              <Badge variant="primary">Fast Setup</Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleComplete} className="space-y-5">
              {/* GSTIN or Unregistered toggle */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-text-secondary">
                    Are you GST Registered?
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-medium text-text-secondary">
                    <input
                      type="checkbox"
                      checked={!isGstRegistered}
                      onChange={(e) => setIsGstRegistered(!e.target.checked)}
                      className="rounded border-border text-primary-600 focus:ring-primary-500"
                    />
                    Unregistered / Composition dealer
                  </label>
                </div>

                {isGstRegistered && (
                  <div>
                    <Input
                      label="15-Digit GSTIN"
                      value={gstin}
                      onChange={handleGstinChange}
                      maxLength={15}
                      placeholder="e.g. 27AABCS1429B1ZB"
                      className="font-mono uppercase tracking-wider"
                      hint="First 2 digits represent your state (e.g., 27 for Maharashtra, 07 for Delhi)."
                    />
                  </div>
                )}
              </div>

              {/* Business Name */}
              <div>
                <Input
                  label="Legal / Trade Business Name"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Shree Krishna Traders"
                />
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Business Category
                </label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                >
                  <option value="Kirana & FMCG Retail">Kirana & FMCG Retail</option>
                  <option value="Supermarket / Departmental">Supermarket / Departmental</option>
                  <option value="Hardware & Sanitaryware">Hardware & Electricals</option>
                  <option value="Pharmacy & Healthcare">Pharmacy & Healthcare</option>
                  <option value="Textile & Ready Made Garments">Textile & Garments</option>
                  <option value="Restaurant & Food Services">Restaurant & Food Services</option>
                  <option value="Wholesale Distributor">Wholesale Distributor</option>
                  <option value="Professional / Agency Services">Professional Services</option>
                </select>
              </div>

              {/* State & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    State / Union Territory
                  </label>
                  <select
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary-500"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s.code} value={s.code}>
                        {s.code} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Input
                    label="City / Town"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Mumbai"
                  />
                </div>
              </div>

              {/* Taxpayer Scheme */}
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Taxpayer Scheme
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div
                    onClick={() => setTaxpayerScheme('regular')}
                    className={`cursor-pointer rounded-lg border p-3 text-xs ${
                      taxpayerScheme === 'regular'
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/40 font-semibold text-primary-900 dark:text-primary-200'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    <div className="font-bold text-sm">Regular</div>
                    <div className="text-[11px] mt-0.5 opacity-80">Monthly GSTR-1 & 3B with full ITC</div>
                  </div>

                  <div
                    onClick={() => setTaxpayerScheme('composition_goods')}
                    className={`cursor-pointer rounded-lg border p-3 text-xs ${
                      taxpayerScheme === 'composition_goods'
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/40 font-semibold text-primary-900 dark:text-primary-200'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    <div className="font-bold text-sm">Composition</div>
                    <div className="text-[11px] mt-0.5 opacity-80">Flat 1% tax rate, quarterly CMP-08</div>
                  </div>

                  <div
                    onClick={() => setTaxpayerScheme('qrmp')}
                    className={`cursor-pointer rounded-lg border p-3 text-xs ${
                      taxpayerScheme === 'qrmp'
                        ? 'border-primary-600 bg-primary-50/50 dark:bg-primary-950/40 font-semibold text-primary-900 dark:text-primary-200'
                        : 'border-border bg-surface text-text-secondary hover:bg-surface-tertiary'
                    }`}
                  >
                    <div className="font-bold text-sm">QRMP</div>
                    <div className="text-[11px] mt-0.5 opacity-80">Quarterly return, monthly challan payment</div>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full h-11 text-sm shadow-md"
                  isLoading={loading}
                >
                  Save & Open Shop Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>

          <CardFooter className="border-t border-border bg-surface-secondary/40 py-3 text-xs text-text-secondary flex items-center gap-2">
            <Info className="h-4 w-4 text-primary-600 shrink-0" />
            <span>You can adjust tax schemes and add additional shop branches anytime in Settings.</span>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

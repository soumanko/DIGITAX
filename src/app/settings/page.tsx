'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DEMO_SHOP } from '@/lib/demo-data';
import { createClient } from '@/lib/supabase/client';
import { gstinSchema } from '@/lib/validation/schemas';
import {
  Settings,
  Store,
  ShieldCheck,
  CheckCircle2,
  Globe2,
  Key,
  LogOut,
  Save,
  AlertTriangle,
  AlertCircle
} from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [shopName, setShopName] = useState(DEMO_SHOP.name);
  const [gstin, setGstin] = useState(DEMO_SHOP.gstin || '');
  const [businessType, setBusinessType] = useState(DEMO_SHOP.business_type || '');
  const [city, setCity] = useState(DEMO_SHOP.city || '');
  const [scheme, setScheme] = useState<'regular' | 'composition_goods' | 'qrmp'>('regular');
  const [language, setLanguage] = useState<'en' | 'hi' | 'bn' | 'mr'>('en');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [gstinError, setGstinError] = useState<string | null>(null);

  useEffect(() => {
    async function loadShop() {
      try {
        const res = await fetch('/api/shops');
        if (res.ok) {
          const data = await res.json();
          if (data.shop) {
            if (data.shop.name) setShopName(data.shop.name);
            if (data.shop.gstin) setGstin(data.shop.gstin);
            if (data.shop.business_type) setBusinessType(data.shop.business_type);
            if (data.shop.city) setCity(data.shop.city);
            if (data.shop.taxpayer_scheme) setScheme(data.shop.taxpayer_scheme);
            if (data.shop.preferred_language) setLanguage(data.shop.preferred_language);
            return;
          }
        }
      } catch (err) {
        console.warn('Could not load shop from API:', err);
      }

      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('digitax_active_shop');
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.name) setShopName(parsed.name);
            if (parsed.gstin) setGstin(parsed.gstin);
            if (parsed.business_type) setBusinessType(parsed.business_type);
            if (parsed.city) setCity(parsed.city);
            if (parsed.taxpayer_scheme) setScheme(parsed.taxpayer_scheme);
            if (parsed.preferred_language) setLanguage(parsed.preferred_language);
          } catch (e) {}
        }
      }
    }
    loadShop();
  }, []);

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveError(null);
    setSavedSuccess(false);

    // Validate GSTIN if provided (DIGITAX-013)
    if (gstin && gstin.trim() !== '') {
      try {
        gstinSchema.parse(gstin);
        setGstinError(null);
      } catch {
        setGstinError('Invalid GSTIN format. Expected 15-character alphanumeric (e.g., 27AABCS1429B1ZB).');
        setIsSaving(false);
        return;
      }
    } else {
      setGstinError(null);
    }

    const updated = {
      ...DEMO_SHOP,
      name: shopName,
      gstin: gstin || null,
      business_type: businessType,
      city,
      taxpayer_scheme: scheme,
      preferred_language: language,
    };

    try {
      const res = await fetch('/api/shops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Save failed' }));
        setSaveError(errorData.error || 'Failed to save shop settings');
        setIsSaving(false);
        return;
      }

      const data = await res.json();

      if (typeof window !== 'undefined' && data.shop) {
        localStorage.setItem('digitax_active_shop', JSON.stringify(data.shop));
      }

      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Network error saving shop settings');
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out notice:', err);
    }
    document.cookie = 'dx_demo_session=; path=/; max-age=0;';
    router.push('/login');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary-600" />
              Shop Settings & Tax Profile
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">
              Manage your business registration, taxpayer scheme, and Indic voice assistant preferences.
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleSignOut}
            className="text-xs shadow-xs"
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" />
            Sign Out of Shop
          </Button>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <strong>Settings Saved:</strong> Shop profile and GST configurations updated successfully.
          </div>
        )}
        {saveError && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-800 dark:text-red-300 flex items-center gap-2 animate-fade-in">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <strong>Save Failed:</strong> {saveError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Business & GST Profile */}
          <Card>
            <CardHeader className="pb-3 border-b border-border bg-surface-secondary/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Store className="h-4 w-4 text-primary-600" />
                Business & GSTIN Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text-secondary mb-1">
                    Business / Shop Name
                  </label>
                  <Input
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text-secondary mb-1">
                    15-Digit GSTIN
                  </label>
                  <Input
                    value={gstin}
                    onChange={(e) => {
                      setGstin(e.target.value.toUpperCase());
                      setGstinError(null);
                    }}
                    className="font-mono uppercase"
                    maxLength={15}
                    error={gstinError || undefined}
                  />
                  {gstinError && (
                    <p id="gstin-error" className="text-xs text-error-600" role="alert">
                      {gstinError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-text-secondary mb-1">
                    Business Category
                  </label>
                  <Input
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block font-semibold text-text-secondary mb-1">
                    City / Town
                  </label>
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  Taxpayer Scheme
                </label>
                <select
                  value={scheme}
                  onChange={(e) => setScheme(e.target.value as 'regular' | 'composition_goods' | 'qrmp')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:ring-2 focus:ring-primary-500"
                >
                  <option value="regular">Regular Scheme (Monthly GSTR-1 & 3B, Full ITC)</option>
                  <option value="composition_goods">Composition Scheme (1% flat tax, CMP-08 quarterly)</option>
                  <option value="qrmp">QRMP Scheme (Quarterly Return Monthly Payment)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Assistant & Language Preferences */}
          <Card>
            <CardHeader className="pb-3 border-b border-border bg-surface-secondary/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-primary-600" />
                Language & Voice Configuration (GNANI EVON / TIMBRE)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-text-secondary mb-1">
                  Default Language for Voice Assistant
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'bn' | 'mr')}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-primary focus:ring-2 focus:ring-primary-500"
                >
                  <option value="hi">हिंदी (Hindi)</option>
                  <option value="en">English (Indian)</option>
                  <option value="mr">मराठी (Marathi)</option>
                  <option value="bn">বাংলা (Bengali)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Security & Isolation */}
          <Card>
            <CardHeader className="pb-3 border-b border-border bg-surface-secondary/40">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Data Security & Tenant Isolation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-text-secondary space-y-2">
              <p>
                All documents and bank ledgers for <strong>{shopName}</strong> are protected with Supabase Row Level Security (RLS) policies. Only authenticated team members assigned to this shop tenant have access.
              </p>
              <div className="flex items-center gap-1.5 text-emerald-600 font-semibold pt-1">
                <CheckCircle2 className="h-4 w-4" />
                Multi-Tenant Isolation Enforced at Database Engine Level
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" variant="primary" className="text-xs shadow-md">
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save All Changes
            </Button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

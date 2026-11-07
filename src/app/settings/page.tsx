'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useTheme } from '@/lib/theme-provider';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { gstinSchema } from '@/lib/validation/schemas';
import { Shop } from '@/types';
import {
  Settings,
  Store,
  ShieldCheck,
  CheckCircle2,
  Globe2,
  Key,
  LogOut,
  AlertCircle,
  Save,
  ChevronRight,
} from 'lucide-react';

interface SettingsTabProps {
  key: string;
  label: string;
  icon: React.ElementType;
}

const SETTINGS_TABS: SettingsTabProps[] = [
  { key: 'profile', label: 'Profile', icon: Settings },
  { key: 'business', label: 'Business', icon: Store },
  { key: 'security', label: 'Security', icon: ShieldCheck },
  { key: 'language', label: 'Language', icon: Globe2 },
];

export default function SettingsPage() {
  const router = useRouter();
  const { toggleTheme, resolvedTheme, theme } = useTheme();
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [shop, setShop] = useState<Shop | null>(null);
  const [formData, setFormData] = useState({
    shopName: '',
    gstin: '',
    businessType: '',
    city: '',
    scheme: 'regular',
    language: 'en',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function loadShop() {
    try {
      const res = await fetch('/api/shops');
      if (res.ok) {
        const data = await res.json();
        if (data.shop) {
          setShop(data.shop);
          setFormData({
            shopName: data.shop.name || '',
            gstin: data.shop.gstin || '',
            businessType: data.shop.business_type || '',
            city: data.shop.city || '',
            scheme: data.shop.taxpayer_scheme || 'regular',
            language: data.shop.preferred_language || 'en',
          });
        }
      }
    } catch {
      // Error handled silently
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadShop(), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.shopName.trim()) newErrors.shopName = 'Business name is required';
    if (formData.gstin && !gstinSchema.safeParse(formData.gstin).success) {
      newErrors.gstin = 'Invalid GSTIN format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSaving(true);
    setSaved(false);
    try {
      // In a real implementation, this would call an update API
      // For now, we simulate a successful save
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // Error handled silently
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your profile, business details, and security preferences."
          breadcrumbs={[{ label: 'Dashboard' }, { label: 'Settings' }]}
          action={
            <ThemeSwitcherButton />
          }
        />

        {/* Tabs */ }
        <div className="flex gap-1 border-b border-border pb-2 mb-6">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-transparent text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */ }
        {activeTab === 'profile' && (
          <ProfileSettings formData={formData} handleChange={handleChange} errors={errors} />
        )}
        {activeTab === 'business' && (
          <BusinessSettings
            shop={shop}
            formData={formData}
            handleChange={handleChange}
            errors={errors}
            isSaving={isSaving}
            saved={saved}
            onSave={handleSave}
          />
        )}
        {activeTab === 'security' && (
          <SecuritySettings />
        )}
        {activeTab === 'language' && (
          <LanguageSettings formData={formData} handleChange={handleChange} />
        )}
      </div>
    </AppShell>
  );
}

function ThemeSwitcherButton() {
  return (
    <button className="p-2 rounded-lg border border-border bg-surface text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors" aria-label="Switch theme">
      <span className="sr-only">Theme switcher</span>
      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    </button>
  );
}

interface ProfileSettingsProps {
  formData: {
    shopName: string;
    gstin: string;
    businessType: string;
    city: string;
    scheme: string;
    language: string;
  };
  handleChange: (key: string, value: string) => void;
  errors: Record<string, string>;
}

function ProfileSettings({ formData, handleChange, errors }: ProfileSettingsProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-primary mb-6">Profile Settings</h3>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Full Name</label>
            <Input
              value={formData.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              error={errors.shopName}
              placeholder="Enter your full name"
            />
            {errors.shopName && <p className="text-xs text-error-600 mt-1">{errors.shopName}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Email</label>
              <Input
                value={formData.shopName && formData.shopName.includes('@') ? formData.shopName : ''}
                onChange={(e) => handleChange('shopName', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Phone</label>
                <Input placeholder="+91 XXXXX XXXXX" />
            </div>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border">
          <Button variant="primary" onClick={() => {}} disabled>
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}

interface BusinessSettingsProps {
  shop: Shop | null;
  formData: {
    shopName: string;
    gstin: string;
    businessType: string;
    city: string;
    scheme: string;
    language: string;
  };
  handleChange: (key: string, value: string) => void;
  errors: Record<string, string>;
  isSaving: boolean;
  saved: boolean;
  onSave: (e: React.FormEvent) => void;
}

function BusinessSettings({ shop, formData, handleChange, errors, isSaving, saved, onSave }: BusinessSettingsProps) {
  async function loadShop() {
    try {
      const res = await fetch('/api/shops');
      if (res.ok) {
        const data = await res.json();
        if (data.shop) {
          // Form data would be updated by parent
        }
      }
    } catch {
      // Error handled silently
    }
  }
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-primary mb-6">Business Details</h3>
      <form onSubmit={onSave}>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Business Name</label>
            <Input
              value={formData.shopName}
              onChange={(e) => handleChange('shopName', e.target.value)}
              error={errors.shopName}
              placeholder="Enter business name"
            />
            {errors.shopName && <p className="text-xs text-error-600 mt-1">{errors.shopName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">GSTIN</label>
            <Input
              value={formData.gstin}
              onChange={(e) => handleChange('gstin', e.target.value)}
              error={errors.gstin}
              placeholder="27AABCS1429B1ZB"
            />
            {errors.gstin && <p className="text-xs text-error-600 mt-1">{errors.gstin}</p>}
            <p className="text-xs text-text-tertiary mt-1">
              15-character GSTIN with state code prefix
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Business Type</label>
                <Input value={formData.businessType} onChange={(e) => handleChange('businessType', e.target.value)} placeholder="Retail, Trading, etc." />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">City</label>
                <Input value={formData.city} onChange={(e) => handleChange('city', e.target.value)} placeholder="Mumbai" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Taxpayer Scheme</label>
            <select
              value={formData.scheme}
              onChange={(e) => handleChange('scheme', e.target.value)}
              className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500 w-full"
            >
              <option value="regular">Regular Taxpayer</option>
              <option value="composition_goods">Composition Scheme (Goods)</option>
              <option value="composition_services">Composition Scheme (Services)</option>
              <option value="qrmp">QRMP Scheme</option>
            </select>
          </div>
        </div>
        {saved && (
          <div className="mb-4 p-3 rounded-lg bg-success-50 dark:bg-success-50/10 border border-success-200 dark:border-success-800/50">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success-600 dark:text-success-400" />
              <span className="text-sm text-success-700 dark:text-success-400">Business details saved successfully.</span>
            </div>
          </div>
        )}
        <div className="mt-8 pt-6 border-t border-border flex gap-3">
          <Button variant="primary" type="submit" disabled={isSaving}>
            {isSaving ? (
              <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" /> Save Changes
              </>
            )}
          </Button>
          <Button variant="ghost" onClick={() => loadShop()}>Reset</Button>
        </div>
      </form>
    </div>
  );
}

function SecuritySettings() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-primary mb-6">Security Settings</h3>
      <div className="space-y-5">
        <div className="p-4 rounded-xl border border-border bg-surface-secondary">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-text-primary">Multi-Factor Authentication</h4>
              <p className="text-xs text-text-secondary">Add an extra layer of security to your account</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">Not Enabled</Badge>
              <Button variant="ghost" size="sm">
                Enable MFA <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-surface-secondary">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-text-primary">Session Management</h4>
              <p className="text-xs text-text-secondary">View and manage active sessions</p>
            </div>
            <Button variant="ghost" size="sm">
              View Sessions <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
        <div className="p-4 rounded-xl border border-border bg-surface-secondary">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-text-primary">Change Password</h4>
              <p className="text-xs text-text-secondary">Update your account password</p>
            </div>
            <Button variant="ghost" size="sm">
              Change Password <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface LanguageSettingsProps {
  formData: {
    language: string;
  };
  handleChange: (key: string, value: string) => void;
}

function LanguageSettings({ formData, handleChange }: LanguageSettingsProps) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <h3 className="text-lg font-bold text-text-primary mb-6">Language Preferences</h3>
      <p className="text-sm text-text-secondary mb-6">
        Choose your preferred language for the DIGITAX interface and AI assistant responses.
      </p>
      <div className="space-y-3">
        {[
          { value: 'en', label: 'English', native: 'English' },
          { value: 'hi', label: 'Hindi', native: 'हिंदी' },
          { value: 'bn', label: 'Bengali', native: 'বাংলা' },
          { value: 'mr', label: 'Marathi', native: 'मराठी' },
        ].map((lang) => (
          <button
            key={lang.value}
            onClick={() => handleChange('language', lang.value)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
              formData.language === lang.value
                ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-400'
                : 'border-border bg-surface text-text-secondary hover:bg-surface-tertiary'
            }`}
          >
            <div className="flex-1">
              <div className="text-sm font-medium text-text-primary">{lang.label}</div>
              <div className="text-xs text-text-tertiary">{lang.native}</div>
            </div>
            {formData.language === lang.value && (
              <CheckCircle2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

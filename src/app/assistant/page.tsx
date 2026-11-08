'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useTheme } from '@/lib/theme-provider';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { money } from '@/lib/decimal';
import {
  MessageSquare,
  Send,
  Sparkles,
  Copy,
  ChevronRight,
  Bot,
} from 'lucide-react';
import { askGnaniEvon, GnaniMessage } from '@/lib/ai/gnani';

interface AssistantContext {
  shopName: string;
  gstin: string | null;
  state: string;
  taxpayerScheme: string;
  unreconciledCount: number;
  openInvoicesTotal: string;
  currentPeriod: string;
  shopId: string;
  userId: string;
}

interface MessageBubbleProps {
  message: GnaniMessage;
  isUser: boolean;
}

function MessageBubble({ message, isUser }: MessageBubbleProps) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${
          isUser
            ? 'bg-primary-600 text-white ml-auto'
            : 'bg-surface border border-border text-text-primary'
        }`}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-5 w-5 rounded-full bg-gradient-primary flex items-center justify-center text-white shadow-sm shadow-primary-500/30">
                <Sparkles className="h-2.5 w-2.5" />
              </div>
              <span className="text-xs font-medium text-primary-600 dark:text-primary-400">GNANI</span>
            </div>
          )}
          <div className="prose prose-sm max-w-none">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className="mb-2 last:mb-0">{escapeHtml(line)}</p>
            ))}
          </div>
          {!isUser && (
            <p className="text-[10px] text-text-tertiary mt-2 text-right">
              AI-generated response • Verify against source records
            </p>
          )}
          {isUser ? (
            <button
              onClick={() => {
                navigator.clipboard.writeText(message.content);
              }}
              className="ml-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
              title="Copy"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const { resolvedTheme } = useTheme();
  const [messages, setMessages] = useState<GnaniMessage[]>([
    {
      role: 'assistant',
      content: 'नमस्ते! I am your DIGITAX GST Copilot, powered by GNANI EVON V3.3. I can answer questions about your sales invoices, Input Tax Credit, bank reconciliation, and GST return preparation. You can type in English, हिंदी, বাংলা, or मराठी.',
    },
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'bn' | 'mr'>('en');
  const [isThinking, setIsThinking] = useState(false);
  const [shopContext, setShopContext] = useState<AssistantContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  [resolvedTheme];

  useEffect(() => {
    loadShopContext();
  }, []);

  async function loadShopContext() {
    try {
      const res = await fetch('/api/shops');
      if (res.ok) {
        const data = await res.json();
        if (data.shop) {
          const [invRes] = await Promise.all([fetch('/api/invoices'), fetch('/api/transactions')]);
          const invData = await invRes.json();
          const invoices = Array.isArray(invData.invoices)
            ? (invData.invoices as { amount_due?: string }[])
            : [];
          const openDue = invoices.reduce(
            (acc, i) => acc.plus(money(i.amount_due || '0')),
            money(0)
          );
          setShopContext({
            shopName: data.shop.name,
            gstin: data.shop.gstin,
            state: data.shop.state || 'Maharashtra',
            taxpayerScheme: data.shop.taxpayer_scheme || 'regular',
            unreconciledCount: 0,
            openInvoicesTotal: openDue.toString(),
            currentPeriod: 'Current Month',
            shopId: data.shop.id,
            userId: data.userId || 'unknown',
          });
        }
      }
    } catch {
      // Error handled silently
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadShopContext(), 0);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking || !shopContext) return;

    const userMessage: GnaniMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsThinking(true);
    setError(null);

    try {
      const res = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [userMessage],
          language,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { role: 'assistant', content: data.text || 'No response received' }]);
      } else {
        setError('Failed to get response from assistant');
      }
    } catch {
      setError('Network error connecting to assistant');
    } finally {
      setIsThinking(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [input, isThinking, shopContext, language]);

  const suggestedQuestions = [
    'What is my current GST liability?',
    'How many invoices are pending review?',
    'Which transactions are unmatched?',
    'What is my Input Tax Credit for this month?',
  ];

  return (
    <AppShell>
      <div className="flex flex-col h-full">
        <PageHeader
          title="GNANI EVON V3.3"
          description="AI-powered GST bookkeeping assistant for your business."
          breadcrumbs={[{ label: 'Dashboard' }, { label: 'AI Assistant' }]}
          action={
            <Badge variant="accent" size="sm">
              {language.toUpperCase()}
            </Badge>
          }
        />

        <div className="flex-1 overflow-hidden flex flex-col relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 dark:from-primary-900/10 via-surface to-surface pointer-events-none" />

          <div className="flex-1 overflow-y-auto p-6 relative z-10">
            {messages.length === 0 ? (
              <EmptyState
                icon={<Bot className="h-12 w-12 text-text-tertiary" />}
                title="Start a conversation"
                description="Ask GNANI about your GST, invoices, or bank reconciliation."
              />
            ) : (
              <div className="space-y-6" ref={messagesEndRef}>
                {messages.map((msg, idx) => (
                  <MessageBubble key={idx} message={msg} isUser={msg.role === 'user'} />
                ))}
                {isThinking && (
                  <div className="flex justify-start">
                    <div className="bg-surface border border-border p-4 rounded-2xl shadow-sm flex items-start gap-2 animate-pulse">
                      <div className="h-5 w-5 rounded-full bg-gradient-primary flex items-center justify-center text-white shadow-sm">
                        <Sparkles className="h-2.5 w-2.5" />
                      </div>
                      <div className="flex-1">
                        <div className="h-4 bg-surface-tertiary rounded w-3/4 mb-2" />
                        <div className="h-4 bg-surface-tertiary rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="flex justify-start">
                    <div className="bg-error-50 dark:bg-error-50/20 border border-error-200 dark:border-error-800/50 p-4 rounded-2xl text-error-700 dark:text-error-400">
                      {error}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-surface p-4 relative z-10">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'bn' | 'mr')}
                  className="bg-surface border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="en">English</option>
                  <option value="hi">हिंदी</option>
                  <option value="bn">বাংলা</option>
                  <option value="mr">मराठी</option>
                </select>
                <Input
                  placeholder="Ask about GST, invoices, reconciliation…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isThinking || !shopContext}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isThinking || !input.trim() || !shopContext}
                  isLoading={isThinking}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {!shopContext && (
                <p className="mt-2 text-xs text-text-tertiary">
                  Loading business context…
                </p>
              )}
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              <p className="text-xs font-semibold text-text-tertiary uppercase mb-2 ml-1">Suggested questions</p>
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(q);
                    void handleSubmit({
                      preventDefault: () => {},
                    } as React.FormEvent);
                  }}
                  disabled={isThinking || !shopContext}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-border bg-surface hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function formatINR(amount: string | number): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0.00';
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
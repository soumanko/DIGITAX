'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { escapeHtml } from '@/lib/security/xss-sanitizer';
import { money } from '@/lib/decimal';
import {
  MessageSquare,
  Send,
  Sparkles,
  Copy,
  Mic,
  MicOff,
  Volume2,
  VolumeOff,
  X,
  Bot,
  AlertCircle,
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
  totalSales?: string;
  totalPurchases?: string;
  totalITC?: string;
  totalOutputTax?: string;
  netTaxPayable?: string;
  paidInvoices?: number;
  unpaidInvoices?: number;
  pendingReviewCount?: number;
  matchedTransactions?: number;
  unmatchedTransactions?: number;
  invoices?: any[];
}

interface AIAssistantWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

function MessageBubble({ message, isUser, isSpeaking, speakText }: { message: GnaniMessage; isUser: boolean; isSpeaking: boolean; speakText: (text: string) => void }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[90%] p-3 rounded-2xl shadow-sm ${isUser ? 'bg-primary-600 text-white ml-auto' : 'bg-surface border border-border text-text-primary'}`}
      >
        <div className="flex items-start gap-2">
          {!isUser && (
            <div className="flex items-center gap-1 mt-0.5">
              <div className="h-4 w-4 rounded-full bg-gradient-primary flex items-center justify-center text-white shadow-sm shadow-primary-500/30">
                <Sparkles className="h-2 w-2" />
              </div>
              <span className="text-[10px] font-medium text-primary-600 dark:text-primary-400">GNANI</span>
            </div>
          )}
          <div className="prose prose-xs max-w-none">
            {message.content.split('\n').map((line, i) => (
              <p key={i} className="mb-1 last:mb-0">{escapeHtml(line)}</p>
            ))}
          </div>
          {!isUser && (
            <button
              onClick={() => {
                const plainText = message.content
                  .replace(/\*\*/g, '')
                  .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                  .replace(/#{1,6}\s/g, '')
                  .trim();
                speakText(plainText);
              }}
              disabled={isSpeaking}
              className="ml-1 mt-0.5 opacity-60 hover:opacity-100 transition-opacity p-1 rounded hover:bg-surface-secondary"
              title="Read aloud"
            >
              {isSpeaking ? <VolumeOff className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
            </button>
          )}
          {isUser ? (
            <button
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="ml-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
              title="Copy"
            >
              <Copy className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AIAssistantWidget({ isOpen, onClose }: AIAssistantWidgetProps) {
  const [messages, setMessages] = useState<GnaniMessage[]>([
    {
      role: 'assistant',
      content: 'नमस्ते! I am your DIGITAX GST Copilot. Ask me about your invoices, GST liability, ITC, or bank reconciliation in English, हिंदी, বাংলা, or मराठी.',
    },
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'bn' | 'mr'>('en');
  const [isThinking, setIsThinking] = useState(false);
  const [shopContext, setShopContext] = useState<AssistantContext | null>(null);
  const [contextError, setContextError] = useState<string | null>(null);
  const [contextLoading, setContextLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Voice state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadShopContext();
      initVoice();
    }
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
        synthesisRef.current = null;
      }
    };
  }, [isOpen]);

  const initVoice = useCallback(() => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    const Synthesis = (window as unknown as { speechSynthesis?: SpeechSynthesis }).speechSynthesis;

    if (SpeechRecognition) {
      setVoiceSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';

      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      rec.onerror = () => setIsListening(false);
      rec.onend = () => setIsListening(false);

      recognitionRef.current = rec;
    }

    if (Synthesis) synthesisRef.current = Synthesis;
  }, [language]);

  async function loadShopContext() {
    setContextLoading(true);
    setContextError(null);
    try {
      const res = await fetch('/api/shops');
      if (!res.ok) {
        setContextError(res.status === 401 ? 'Please sign in to use the AI assistant.' : 'Sign in and complete business onboarding.');
        return;
      }
      const data = await res.json();
      if (!data?.shop) {
        setContextError('Sign in and complete business onboarding to use the AI assistant.');
        return;
      }
      const [invRes, reconRes] = await Promise.all([fetch('/api/invoices'), fetch('/api/reconciliation')]);
      const invData = await invRes.json();
      const invoices = Array.isArray(invData.invoices) ? (invData.invoices as any[]) : [];
      const openDue = invoices.reduce((acc, i) => acc.plus(money(i.amount_due || '0')), money(0));
      let unreconciledCount = 0;
      let reconData: any = null;
      if (reconRes.ok) {
        reconData = await reconRes.json();
        unreconciledCount = Array.isArray(reconData.suggestions) ? reconData.suggestions.length : 0;
      }

      const totalSales = invoices
        .filter((i: any) => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
        .reduce((acc, i) => acc.plus(money(i.total_amount || '0')), money(0));
      const totalPurchases = invoices
        .filter((i: any) => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
        .reduce((acc, i) => acc.plus(money(i.total_amount || '0')), money(0));
      const totalITC = invoices
        .filter((i: any) => i.invoice_type === 'purchase_tax_invoice' || i.direction === 'purchase')
        .reduce((acc, i) => acc.plus(money(i.cgst_total || '0').plus(money(i.sgst_total || '0')).plus(money(i.igst_total || '0')).plus(money(i.cess_total || '0'))), money(0));
      const totalOutputTax = invoices
        .filter((i: any) => i.invoice_type === 'sales_tax_invoice' || i.direction === 'sales')
        .reduce((acc, i) => acc.plus(money(i.cgst_total || '0').plus(money(i.sgst_total || '0')).plus(money(i.igst_total || '0')).plus(money(i.cess_total || '0'))), money(0));
      const netTaxPayable = totalOutputTax.minus(totalITC).isNegative() ? money(0) : totalOutputTax.minus(totalITC);

      const paidInvoices = invoices.filter((i: any) => i.payment_status === 'paid').length;
      const unpaidInvoices = invoices.filter((i: any) => i.payment_status !== 'paid').length;
      const pendingReview = invoices.filter((i: any) => i.review_state === 'pending_review').length;
      const matchedTxns = Array.isArray(reconData?.suggestions) ? reconData.suggestions.filter((t: any) => t.match_status === 'confirmed').length : 0;

      const now = new Date();
      const periodLabel = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
      setShopContext({
        shopName: data.shop.name,
        gstin: data.shop.gstin,
        state: data.shop.state || '',
        taxpayerScheme: data.shop.taxpayer_scheme || 'regular',
        unreconciledCount,
        openInvoicesTotal: openDue.toString(),
        currentPeriod: periodLabel,
        shopId: data.shop.id,
        userId: data.userId || 'unknown',
        totalSales: totalSales.toString(),
        totalPurchases: totalPurchases.toString(),
        totalITC: totalITC.toString(),
        totalOutputTax: totalOutputTax.toString(),
        netTaxPayable: netTaxPayable.toString(),
        paidInvoices,
        unpaidInvoices,
        pendingReviewCount: pendingReview,
        matchedTransactions: matchedTxns,
        unmatchedTransactions: unreconciledCount,
        invoices: (invoices || []).map((inv: any) => ({
          id: inv.id,
          invoice_number: inv.invoice_number,
          invoice_date: inv.invoice_date,
          customer_name: inv.customer_name,
          customer_gstin: inv.customer_gstin,
          total_amount: inv.total_amount,
          payment_status: inv.payment_status,
          review_state: inv.review_state,
          direction: inv.direction,
        })),
      });
    } catch {
      setContextError('Could not load your business context. Check your connection and retry.');
    } finally {
      setContextLoading(false);
    }
  }

  const speakText = useCallback(
    (text: string) => {
      if (!synthesisRef.current) return;
      synthesisRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'hi' ? 'hi-IN' : language === 'bn' ? 'bn-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthesisRef.current.speak(utterance);
    },
    [language]
  );

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening || isThinking) return;
    setInput('');
    setError(null);
    setIsListening(true);
    recognitionRef.current.start();
  }, [isListening, isThinking]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    recognitionRef.current.abort();
    setIsListening(false);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
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
          body: JSON.stringify({ messages: [userMessage], language }),
        });
        if (res.ok) {
          const data = await res.json();
          const reply = data.text || 'No response received';
          setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
          if (voiceSupported && !isSpeaking) {
            speakText(reply);
          }
        } else {
          setError('Failed to get response from assistant');
        }
      } catch {
        setError('Network error connecting to assistant');
      } finally {
        setIsThinking(false);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    },
    [input, isThinking, shopContext, language, voiceSupported, isSpeaking, speakText]
  );

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      onClick={(e) => {
        // Close when clicking outside the panel
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Chat Panel */}
      <div className="absolute right-0 top-0 h-full w-full md:w-[420px] bg-surface border-l border-border shadow-2xl flex flex-col z-50 transform transition-transform duration-300 translate-x-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/95 backdrop-blur shrink-0">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-xl bg-gradient-primary flex items-center justify-center text-white shadow-sm">
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-text-primary">GNANI EVON</div>
              <div className="text-xs text-text-tertiary">AI GST Copilot</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-tertiary transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={messagesEndRef}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-32 text-text-tertiary">
              <Bot className="h-8 w-8 text-text-tertiary mb-2" />
              <span className="text-sm">Start a conversation</span>
            </div>
          )}
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} isUser={msg.role === 'user'} isSpeaking={isSpeaking} speakText={speakText} />
          ))}
          {isThinking && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-surface border border-border animate-pulse">
              <div className="h-5 w-5 rounded-full bg-gradient-primary flex items-center justify-center text-white shadow-sm">
                <Sparkles className="h-2.5 w-2.5" />
              </div>
              <div className="flex-1">
                <div className="h-3 bg-surface-tertiary rounded w-3/4 mb-1.5" />
                <div className="h-3 bg-surface-tertiary rounded w-1/2" />
              </div>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-error-50 dark:bg-error-50/20 border border-error-200 dark:border-error-800/50 text-error-700 dark:text-error-400 text-xs">
              {error}
            </div>
          )}
        </div>

        {/* Input Form */}
        <div className="border-t border-border bg-surface p-3 shrink-0">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'bn' | 'mr')}
              className="w-16 bg-surface border border-border rounded-lg px-2 py-2 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="en">EN</option>
              <option value="hi">HI</option>
              <option value="bn">BN</option>
              <option value="mr">MR</option>
            </select>
            <Input
              placeholder="Ask about GST, invoices…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isThinking || !shopContext}
              className="flex-1 text-sm"
            />
            <Button type="submit" variant="primary" size="sm" disabled={isThinking || !input.trim() || !shopContext} isLoading={isThinking}>
              <Send className="h-3.5 w-3.5" />
            </Button>
            {!voiceSupported ? null : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={isListening ? stopListening : startListening}
                disabled={isThinking || !shopContext}
                className="relative p-1.5"
              >
                {isListening ? <MicOff className="h-3.5 w-3.5 animate-pulse" /> : <Mic className="h-3.5 w-3.5" />}
                <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-red-500 {isListening ? 'animate-pulse' : 'hidden'}" />
              </Button>
            )}
          </form>
          {!shopContext && contextLoading ? (
            <p className="mt-1 text-[10px] text-text-tertiary">Loading business context…</p>
          ) : !shopContext && contextError ? (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-error-600">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span className="text-error-700 dark:text-error-400">{contextError}</span>
            </div>
          ) : null}
          {voiceSupported && shopContext && !isThinking && (
            <div className="mt-2 flex items-center gap-1 px-1">
              {isListening ? (
                <span className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Listening…
                </span>
              ) : isSpeaking ? (
                <span className="flex items-center gap-1 text-[10px] text-primary-600 dark:text-primary-400">
                  <Volume2 className="h-2.5 w-2.5" /> Speaking…
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

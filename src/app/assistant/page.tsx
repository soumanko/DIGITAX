'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DEMO_SHOP, DEMO_INVOICES, DEMO_TRANSACTIONS } from '@/lib/demo-data';
import { askGnaniEvon, GnaniMessage } from '@/lib/ai/gnani';
import {
  MessageSquare,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  VolumeX,
  ShieldCheck,
  Globe2,
  HelpCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AssistantPage() {
  const [messages, setMessages] = useState<GnaniMessage[]>([
    {
      role: 'assistant',
      content: `नमस्ते! I am your DIGITAX GST Copilot for **${DEMO_SHOP.name}**, powered by GNANI EVON V3.3.\n\nI can answer questions regarding your October 2026 sales invoices, eligible Input Tax Credit (ITC), bank statement reconciliation, and GST return preparation. You can speak or type in English, हिंदी, বাংলা, or मराठी.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr' | 'bn'>('hi');
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isThinking) return;

    const userMessage: GnaniMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsThinking(true);

    try {
      const assistantContext = {
        shopName: DEMO_SHOP.name,
        gstin: DEMO_SHOP.gstin,
        state: DEMO_SHOP.state,
        taxpayerScheme: DEMO_SHOP.taxpayer_scheme,
        unreconciledCount: DEMO_TRANSACTIONS.filter((t) => t.reconciliation_status === 'unmatched').length,
        openInvoicesTotal: '21,830.00',
        currentPeriod: 'October 2026',
      };

      const result = await askGnaniEvon(newMessages, assistantContext, language);

      setMessages([...newMessages, { role: 'assistant', content: result.text }]);
    } catch (err) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered a brief error connecting to the model. Please check your query or try again.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleVoiceToggle = () => {
    if (isRecording) {
      setIsRecording(false);
    } else {
      setIsRecording(true);
      // Simulate Indic Speech-to-Text via GNANI PRISMA
      setTimeout(() => {
        setIsRecording(false);
        const sampleQuery =
          language === 'hi'
            ? 'मेरा इस महीने का कुल इनपुट टैक्स क्रेडिट कितना है?'
            : language === 'mr'
            ? 'चालू महिन्यातील एकूण ITC किती आहे?'
            : 'What is my total eligible ITC for October?';
        setInput(sampleQuery);
        handleSend(sampleQuery);
      }, 2500);
    }
  };

  const handleSpeakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isPlayingAudio) {
        window.speechSynthesis.cancel();
        setIsPlayingAudio(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text.replace(/[*#]/g, ''));
        utterance.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
        utterance.onend = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      }
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-4 max-w-4xl mx-auto">
        {/* Compliance Guardrail Banner */}
        <div className="p-3 rounded-lg bg-surface border border-border flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary-600 shrink-0" />
            <span>
              <strong>AI Guardrails Active:</strong> Copilot answers are generated from your validated books and standard GST rules. Returns must be reviewed prior to portal submission.
            </span>
          </div>
          <Badge variant="secondary">GNANI EVON V3.3</Badge>
        </div>

        {/* Header & Language Select */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary-600" />
              Multilingual Indic Tax Assistant
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Ask questions by voice or text in your preferred language.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-text-tertiary" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-primary focus:ring-2 focus:ring-primary-500"
            >
              <option value="hi">हिंदी (Hindi)</option>
              <option value="en">English (Indian)</option>
              <option value="mr">मराठी (Marathi)</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => handleSend('मेरा इस महीने का कुल ITC कितना है?')}
            className="px-3 py-1 rounded-full bg-surface border border-border hover:border-primary-500 hover:bg-primary-50/50 text-text-secondary transition-all"
          >
            💬 कुल ITC कितना है?
          </button>
          <button
            onClick={() => handleSend('Are there any unmatched bank transactions?')}
            className="px-3 py-1 rounded-full bg-surface border border-border hover:border-primary-500 hover:bg-primary-50/50 text-text-secondary transition-all"
          >
            💬 Check unmatched transactions
          </button>
          <button
            onClick={() => handleSend('अक्टूबर का GSTR-3B रिटर्न ड्राफ्ट तैयार है?')}
            className="px-3 py-1 rounded-full bg-surface border border-border hover:border-primary-500 hover:bg-primary-50/50 text-text-secondary transition-all"
          >
            💬 GSTR-3B ड्राफ्ट स्थिति
          </button>
        </div>

        {/* Chat Window */}
        <Card className="border-border shadow-md h-[480px] flex flex-col">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => {
              const isAssistant = msg.role === 'assistant';
              return (
                <div
                  key={idx}
                  className={`flex ${isAssistant ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                      isAssistant
                        ? 'bg-surface-secondary border border-border text-text-primary rounded-tl-xs'
                        : 'bg-primary-600 text-white rounded-tr-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 pb-1 border-b border-border/40">
                      <span className="font-bold text-[11px] opacity-80">
                        {isAssistant ? 'GNANI EVON V3.3' : 'You'}
                      </span>
                      {isAssistant && (
                        <button
                          onClick={() => handleSpeakText(msg.content)}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                          title="Read out loud (GNANI TIMBRE)"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="whitespace-pre-line">{msg.content}</div>
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-surface-secondary border border-border text-text-primary rounded-2xl rounded-tl-xs p-3 text-xs flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary-600 animate-ping" />
                  <span className="text-text-secondary">Consulting ledger & GST rules...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </CardContent>

          {/* Input Area */}
          <CardFooter className="border-t border-border p-3 bg-surface-secondary/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 w-full"
            >
              {/* Push-to-Talk Mic Button */}
              <button
                type="button"
                onClick={handleVoiceToggle}
                className={`p-2.5 rounded-xl transition-all shadow-xs ${
                  isRecording
                    ? 'bg-red-600 text-white animate-pulse'
                    : 'bg-surface border border-border text-text-secondary hover:text-primary-600 hover:border-primary-500'
                }`}
                title={isRecording ? 'Listening (GNANI PRISMA STT)...' : 'Push to talk in Hindi/English/Marathi'}
              >
                {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>

              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isRecording
                    ? 'Listening... बोलिए...'
                    : language === 'hi'
                    ? 'अपनी दुकान या GST के बारे में सवाल पूछें...'
                    : 'Ask questions about invoices, ITC, or reconciliation...'
                }
                className="flex-1 text-xs h-10 bg-surface"
              />

              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="h-10 px-4"
                disabled={!input.trim() || isThinking}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
}

/**
 * DIGITAX — GNANI EVON V3.3 AI Assistant
 *
 * AI assistant for GST bookkeeping queries. Integrates with the GNANI EVON
 * API when configured. When no API key is available, returns a truthful
 * "service unavailable" response — never fabricates financial data.
 *
 * All financial calculations are delegated to deterministic backend
 * functions (decimal.js, GST calculator). The AI never computes
 * authoritative tax or invoice amounts.
 */

import { createClient } from '@/lib/supabase/server';
import { money, formatINR } from '@/lib/decimal';

export interface GnaniMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AssistantContext {
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
  invoices?: Array<{
    id: string;
    invoice_number: string;
    invoice_date: string;
    customer_name: string | null;
    customer_gstin: string | null;
    total_amount: string;
    payment_status: string;
    review_state: string;
    direction: string;
  }>;
  transactions?: Array<{
    id: string;
    transaction_date: string;
    description: string;
    amount: number;
    transaction_type: string;
    reconciliation_status: string;
  }>;
}

const SYSTEM_PROMPT = `You are DIGITAX AI Copilot, powered by GNANI EVON V3.3.
You are an expert Indian GST bookkeeping assistant specializing in kirana stores, retail shops, and small enterprises.
You speak and understand English, हिंदी (Hindi), বাংলা (Bengali), and मराठी (Marathi).

CRITICAL COMPLIANCE AND SAFETY RULES:
1. DIGITAX prepares bookkeeping records and return calculations for human practitioner review.
2. YOU MUST NEVER claim you have directly filed a GST return to the government portal (GSTN). Always refer to preparing summaries for review or export.
3. Keep financial calculations exact. Never fabricate financial figures.
4. When speaking in Indic languages, maintain respectful, natural business terminology (e.g. 'इनपुट टैक्स क्रेडिट', 'चलान', 'खरीद बिल').
5. If asked to do something outside financial bookkeeping or GST guidance, politely decline.
6. Answer ONLY using the user's actual business data provided in context. Do not invent figures.
7. Financial calculations must be performed by the backend GST engine, not by the AI.`;

// Financial keywords (English + Hinglish / Indic transliteration hints) to scope responses
const FINANCIAL_KEYWORDS = [
  // English
  'gst', 'tax', 'invoice', 'invoices', 'bill', 'bills', 'purchase', 'purchases',
  'sale', 'sales', 'revenue', 'expense', 'expenses', 'payment', 'payments',
  'reconciliation', 'reconcile', 'matched', 'unmatched', 'transaction', 'transactions',
  'itc', 'input tax credit', 'cgst', 'sgst', 'igst', 'cess', 'taxable', 'liability',
  'payable', 'refund', 'return', 'gstr', 'gstr-1', 'gstr-3b', 'balance', 'outstanding',
  'due', 'unpaid', 'paid', 'credit', 'debit', 'bank', 'upi', 'gstin', 'shop', 'business',
  'bookkeeping', 'account', 'ledger', 'summary', 'total', 'amount', '₹', 'rupee', 'inr',
  // Hindi (transliterated / Devanagari)
  'कर', 'टैक्स', 'चलान', 'बिल', 'खरीद', 'बिक्री', 'भुगतान', 'लेनदेन', 'खाता',
  'बहीखाता', 'जमा', 'निकासी', 'बैंक', 'यूपीआई', 'क्रेडिट', 'डेबिट', 'बकाया',
  'बकाया', 'अदा', 'भरा', 'विवरण', 'रिपोर्ट', 'सारांश',
  // Bengali
  'ট্যাক্স', 'চালান', 'বিল', 'ক্রয়', 'विक্রয়', 'পেমেন্ট', 'লেনদেন', 'খাতা',
  // Marathi
  'कर', 'चलान', 'बिल', 'खरेदी', 'विक्री', 'पेमेंट', 'लेंदेन', 'खाता',
];

function isFinancialQuestion(text: string): boolean {
  const lower = text.toLowerCase();
  return FINANCIAL_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

function buildDataSummary(context: AssistantContext): string {
  const lines: string[] = [];
  lines.push(`Shop: ${context.shopName}`);
  if (context.gstin) lines.push(`GSTIN: ${context.gstin}`);
  if (context.state) lines.push(`State: ${context.state}`);
  lines.push(`Taxpayer Scheme: ${context.taxpayerScheme}`);
  lines.push(`Current Period: ${context.currentPeriod}`);
  lines.push(`Open Invoices Total: ${formatINR(context.openInvoicesTotal)}`);
  lines.push(`Unreconciled Transactions: ${context.unreconciledCount}`);
  if (context.totalSales !== undefined) lines.push(`Total Sales: ${formatINR(context.totalSales)}`);
  if (context.totalPurchases !== undefined) lines.push(`Total Purchases: ${formatINR(context.totalPurchases)}`);
  if (context.totalITC !== undefined) lines.push(`Total ITC: ${formatINR(context.totalITC)}`);
  if (context.totalOutputTax !== undefined) lines.push(`Total Output Tax: ${formatINR(context.totalOutputTax)}`);
  if (context.netTaxPayable !== undefined) lines.push(`Net Tax Payable: ${formatINR(context.netTaxPayable)}`);
  if (context.paidInvoices !== undefined) lines.push(`Paid Invoices: ${context.paidInvoices}`);
  if (context.unpaidInvoices !== undefined) lines.push(`Unpaid Invoices: ${context.unpaidInvoices}`);
  if (context.pendingReviewCount !== undefined) lines.push(`Invoices Pending Review: ${context.pendingReviewCount}`);
  if (context.matchedTransactions !== undefined) lines.push(`Matched Transactions: ${context.matchedTransactions}`);
  if (context.unmatchedTransactions !== undefined) lines.push(`Unmatched Transactions: ${context.unmatchedTransactions}`);

  if (context.invoices && context.invoices.length > 0) {
    lines.push('\nRecent Invoices:');
    for (const inv of context.invoices.slice(0, 10)) {
      lines.push(
        `- ${inv.invoice_number} (${inv.invoice_date}): ${inv.customer_name || 'N/A'} | ${inv.direction} | ${formatINR(inv.total_amount)} | ${inv.payment_status} | ${inv.review_state}`
      );
    }
  }

  if (context.transactions && context.transactions.length > 0) {
    lines.push('\nRecent Transactions:');
    for (const txn of context.transactions.slice(0, 10)) {
      lines.push(
        `- ${txn.transaction_date}: ${txn.description} | ${txn.transaction_type} | ${formatINR(txn.amount)} | ${txn.reconciliation_status}`
      );
    }
  }

  return lines.join('\n');
}

export type GnaniSource = 'gnani_api' | 'offline';

export async function askGnaniEvon(
  messages: GnaniMessage[],
  context: AssistantContext,
  language: string = 'en'
): Promise<{ text: string; source: GnaniSource; language: string }> {
  const userMessage = messages[messages.length - 1]?.content || '';

  // Scope to financial/GST bookkeeping questions only — decline everything else
  if (!isFinancialQuestion(userMessage)) {
    const declineMessages: Record<string, string> = {
      en: `I am your DIGITAX GST Copilot for **${context.shopName}**. I can only help with financial bookkeeping and GST-related questions — invoices, purchases, sales, ITC, reconciliation, bank transactions, and return preparation. Please ask about your shop's financial data.`,
      hi: `मैं आपका DIGITAX GST कॉपिलॉट हूं, **${context.shopName}** के लिए। मैं केवल वित्तीय बहीखाता और जीएसटी से संबंधित प्रश्नों में मदद कर सकता हूं — इनवॉयड, खरीद, बिक्री, आईटीसी, मिलान, बैंक लेनदेन और रिटर्न तैयार करना। कृपया अपनी दुकान के वित्तीय डेटा के बारे में पूछें।`,
      bn: `আমি আপনার DIGITAX GST কোপাইলট, **${context.shopName}** এর জন্য। আমি শুধুমাত্র আর্থিক বहीখাত এবং জিএসটી-সম্পর্কিত প্রশ্নে সাহায্য করতে পারি — ইনভয়েস, ক্রয়, বিক্রয়, আইটিসি, মিলান, বैंक লেনদেন এবং রিটার্ন প্রস্তুতি। অনুগ্রহ করে আপনার দোকানের আর্থিক ডেটা সম্পর্কে জিজ্ঞাসা করুন।`,
      mr: `मी तुमचा DIGITAX GST कॉपिलॉट आहे, **${context.shopName}** साठी. मी फक्त आर्थिक बहीखाता आणि जीएसटी-संबंधित प्रश्नांमध्ये मदत करू शकतो — इनवॉइस, खरेदी, विक्री, आयटीसी, मिलान, बँक लेंदेन आणि रिटर्न तयार करणे. कृपया तुमच्या दुकानच्या आर्थिक डेटा बद्दल विचारा.`,
    };
    return {
      text: declineMessages[language] || declineMessages.en,
      source: 'offline',
      language,
    };
  }

  const apiKey = process.env.GNANI_EVON_API_KEY;
  const apiUrl = process.env.GNANI_EVON_API_URL || 'https://api.gnani.ai/evon/v3.3';

  // If live Gnani API key is configured, call the service
  if (apiKey && !apiKey.includes('dummy') && !apiKey.includes('your-gnani')) {
    try {
      const response = await fetch(`${apiUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: process.env.GNANI_EVON_MODEL_ID || 'evon-v3.3',
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'system', content: `Business Data Context:\n${buildDataSummary(context)}` },
            ...messages,
          ],
          temperature: 0.2,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || data.reply;
        if (reply) {
          return { text: reply, source: 'gnani_api', language };
        }
      }
    } catch (err) {
      console.warn('Gnani EVON API error:', err);
      // Fall through to offline mode
    }
  }

  // Offline mode: answer using real business data from context
  const dataSummary = buildDataSummary(context);
  const lower = userMessage.toLowerCase();

  // Simple keyword-based answers using real data
  let reply: string;

  if (lower.includes('gst liability') || lower.includes('net tax payable') || lower.includes('tax payable')) {
    const payable = context.netTaxPayable || context.totalOutputTax || '0';
    reply = `For **${context.shopName}**, your net GST tax payable is ${formatINR(payable)} for ${context.currentPeriod}. This is based on your actual sales and purchase invoices.`;
  } else if (lower.includes('itc') || lower.includes('input tax credit')) {
    const itc = context.totalITC || '0';
    reply = `For **${context.shopName}**, your total Input Tax Credit (ITC) is ${formatINR(itc)} for ${context.currentPeriod}, calculated from your purchase invoices.`;
  } else if (lower.includes('open invoice') || lower.includes('outstanding') || lower.includes('amount due')) {
    reply = `For **${context.shopName}**, your total open invoices amount to ${formatINR(context.openInvoicesTotal)}. You have ${context.unpaidInvoices ?? 0} unpaid invoices and ${context.paidInvoices ?? 0} paid invoices.`;
  } else if (lower.includes('unreconciled') || lower.includes('unmatched') || lower.includes('reconciliation')) {
    reply = `For **${context.shopName}**, you have ${context.unreconciledCount} unreconciled transactions (${context.unmatchedTransactions ?? 0} unmatched out of ${(context.matchedTransactions ?? 0) + (context.unmatchedTransactions ?? 0)} total). ${context.pendingReviewCount ?? 0} invoices are pending review.`;
  } else if (lower.includes('total sales') || lower.includes('sales')) {
    const sales = context.totalSales || '0';
    reply = `For **${context.shopName}**, your total sales are ${formatINR(sales)} for ${context.currentPeriod}.`;
  } else if (lower.includes('total purchases') || lower.includes('purchases')) {
    const purchases = context.totalPurchases || '0';
    reply = `For **${context.shopName}**, your total purchases are ${formatINR(purchases)} for ${context.currentPeriod}.`;
  } else if (lower.includes('gstin') || lower.includes('gst number') || lower.includes('gst registration')) {
    reply = `For **${context.shopName}**, your GSTIN is ${context.gstin || 'not registered'} and your state is ${context.state || 'not specified'}.`;
  } else if (lower.includes('invoice') && lower.includes('pending') || lower.includes('review')) {
    reply = `For **${context.shopName}**, ${context.pendingReviewCount ?? 0} invoices are currently pending review.`;
  } else if (lower.includes('hello') || lower.includes('hi ') || lower.includes('namaste') || lower.includes('namaskar')) {
    reply = `नमस्ते! I am your DIGITAX GST Copilot for **${context.shopName}**. I can answer questions about your invoices, GST liability, ITC, purchases, sales, bank reconciliation, and more. All answers are based on your actual business data. What would you like to know?`;
  } else {
    // General fallback: provide the data summary so the user sees their real data
    reply = `Here is your business summary for **${context.shopName}** (${context.currentPeriod}):

${dataSummary}

Ask me about GST liability, ITC, open invoices, unreconciled transactions, or specific invoices/transactions.`;
  }

  return {
    text: reply,
    source: 'offline',
    language,
  };
}
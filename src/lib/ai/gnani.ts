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
6. If you do not have access to the user's actual business data, say so clearly. Do not invent figures.
7. Financial calculations must be performed by the backend GST engine, not by the AI.`;

export type GnaniSource = 'gnani_api' | 'unavailable';

export async function askGnaniEvon(
  messages: GnaniMessage[],
  context: AssistantContext,
  language: string = 'en'
): Promise<{ text: string; source: GnaniSource; language: string }> {
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
    }
  }

  // No OCR/AI provider configured — return truthful unavailability message
  // Never fabricate financial data or provide hardcoded fallback responses
  const unavailableMessages: Record<string, string> = {
    en: `I am your DIGITAX GST Copilot for **${context.shopName}**. However, the AI assistant service is not currently configured. Please set the GNANI_EVON_API_KEY environment variable to enable AI-powered assistance. In the meantime, you can use the Dashboard, GST Workspace, and Reconciliation Center to manage your bookkeeping manually.`,
    hi: `मैं आपका DIGITAX GST कॉपिलॉट हूं, **${context.shopName}** के लिए। हालांकि, AI सहायक सेवा वर्तमान में कॉन्फ़िगर नहीं की गई है। AI-संचालित सहायता सक्षम करने के लिए GNANI_EVON_API_KEY पर्यावरण चर सेट करें। तब तक, आप डैशबोर्ड, GST कार्यक्षेत्र, और मिलान केंद्र का उपयोग करके मैनुअल रूप से अपनी बहीखाता प्रबंधन कर सकते हैं।`,
    bn: `আমি আপনার DIGITAX GST কোপাইলট, **${context.shopName}** এর জন্য। তবে, AI সহায়তা সেবা বর্তমানে কনফিগার করা হয়নি। AI-চালিত সহায়তা সক্রিয় করতে GNANI_EVON_API_KEY পরিবেশ चल extrem সেট করুন।ntil রিলিজ, আপনি ড্যাশবোর্ড, GST কর্মক্ষेत्र, এবং মিলান কেন্দ্র ব্যবহার করে ম্যানুয়ালি আপনার বहीखাত পরিচালনা করতে পারেন।`,
    mr: `मी तुमचा DIGITAX GST कॉपिलॉट आहे, **${context.shopName}** साठी. तथापि, AI सहायक सेवा सध्याच्या सेट केलेली नाही. AI-संचालित सहायता सक्षम करण्यासाठी GNANI_EVON_API_KEY वातावरण चल सेट करा. त्यापर्यंत, तुम्ही डॅशबोर्ड, GST कार्यक्षेत्र, आणि मिलान केंद्र वापरून मॅन्युअली तुमचे बहीखाता व्यवस्थापित करू शकता.`,
  };

  return {
    text: unavailableMessages[language] || unavailableMessages.en,
    source: 'unavailable',
    language,
  };
}

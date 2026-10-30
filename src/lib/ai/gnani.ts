/**
 * GNANI EVON V3.3 AI Assistant & Multilingual GST Intelligence Engine
 * Grounded strictly in authentic tenant business records with deterministic tools
 */

export interface GnaniMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AssistantContext {
  shopId: string;
  shopName: string;
  gstin: string | null;
  state: string;
  taxpayerScheme: string;
  unreconciledCount: number;
  openInvoicesTotal: string;
  currentPeriod: string;
  salesTotal: string;
  purchasesTotal: string;
  eligibleITC: string;
  netTaxPayable: string;
  invoicesCount: number;
  transactionsCount: number;
}

const SYSTEM_PROMPT = `You are DIGITAX AI Copilot, powered by GNANI EVON V3.3.
You are an expert Indian GST bookkeeping assistant specializing in kirana stores, retail shops, and small enterprises.
You speak and understand English, हिंदी (Hindi), বাংলা (Bengali), and मराठी (Marathi).

CRITICAL COMPLIANCE AND SAFETY RULES:
1. DIGITAX prepares bookkeeping records and return calculations for human practitioner review.
2. YOU MUST NEVER claim you have directly filed a GST return to the government portal (GSTN). Always refer to preparing summaries for review or export.
3. Keep financial calculations exact. All numbers you state MUST be grounded strictly in the provided shop context.
4. When speaking in Indic languages, maintain respectful, natural business terminology (e.g. 'इनपुट टैक्स क्रेडिट', 'चलान', 'खरीद बिल', 'कराचा ताळमेळ').
5. If data is missing or zero, explicitly inform the user that no records are present for that period.
6. Never fabricate fictitious financial transactions, fake invoice numbers, or imaginary tax credits.`;

export async function askGnaniEvon(
  messages: GnaniMessage[],
  context: AssistantContext,
  language: string = 'en'
): Promise<{ text: string; source: 'gnani_api' | 'grounded_deterministic'; language: string }> {
  const apiKey = process.env.GNANI_EVON_API_KEY;
  const apiUrl = process.env.GNANI_EVON_API_URL || 'https://api.gnani.ai/evon/v3.3';

  // Grounded context prompt injected into model system instructions
  const groundedContextPrompt = `\n[AUTHENTIC BUSINESS RECORDS FOR ${context.shopName.toUpperCase()}]
GSTIN: ${context.gstin || 'Unregistered / Pending'}
State: ${context.state} | Tax Scheme: ${context.taxpayerScheme}
Current Period: ${context.currentPeriod}
Total Invoices on Record: ${context.invoicesCount}
Total Bank/UPI Transactions: ${context.transactionsCount}
Total Recorded Sales Turnover: ₹${context.salesTotal}
Total Recorded Purchases: ₹${context.purchasesTotal}
Eligible Inward ITC: ₹${context.eligibleITC}
Net GST Payable: ₹${context.netTaxPayable}
Open Unpaid Invoices Total: ₹${context.openInvoicesTotal}
Unreconciled Bank Transactions: ${context.unreconciledCount}
\nRemember: All financial answers must use the figures above exclusively.`;

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
            { role: 'system', content: SYSTEM_PROMPT + groundedContextPrompt },
            ...messages,
          ],
          temperature: 0.1,
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
      console.warn('Gnani EVON API error, falling back to grounded deterministic response:', err);
    }
  }

  // Deterministic grounded response engine based strictly on verified records
  const lastUserMsg = (messages[messages.length - 1]?.content || '').toLowerCase();
  let replyText = '';

  if (lastUserMsg.includes('itc') || lastUserMsg.includes('credit') || lastUserMsg.includes('इनपुट') || lastUserMsg.includes('क्रेडिट')) {
    if (language === 'hi' || lastUserMsg.includes('हिंदी')) {
      replyText = `वर्तमान अवधि (${context.currentPeriod}) के लिए आपकी दुकान **${context.shopName}** के रिकॉर्ड्स के अनुसार पात्र इनपुट टैक्स क्रेडिट (ITC) **₹${context.eligibleITC}** है। कुल खरीद टर्नओवर ₹${context.purchasesTotal} है। यह डेटा आपके सत्यापित खरीद बिलों पर आधारित है।`;
    } else if (language === 'mr') {
      replyText = `चालू कालावधीसाठी (${context.currentPeriod}) आपल्या **${context.shopName}** दुकानाचा पात्र इनपुट टॅक्स क्रेडिट (ITC) **₹${context.eligibleITC}** आहे. एकूण खरेदी ₹${context.purchasesTotal} आहे.`;
    } else if (language === 'bn') {
      replyText = `বর্তমান সময়ের (${context.currentPeriod}) জন্য আপনার দোকান **${context.shopName}**-এর যোগ্য ইনপুট ট্যাক্স ক্রেডিট (ITC) **₹${context.eligibleITC}**। মোট ক্রয় ₹${context.purchasesTotal}।`;
    } else {
      replyText = `For the current period (${context.currentPeriod}), your verified eligible Input Tax Credit (ITC) for **${context.shopName}** from inward purchases is **₹${context.eligibleITC}**, calculated from total purchases of ₹${context.purchasesTotal}.`;
    }
  } else if (lastUserMsg.includes('reconcil') || lastUserMsg.includes('bank') || lastUserMsg.includes('upi') || lastUserMsg.includes('मिलान') || lastUserMsg.includes('ताळमेळ')) {
    if (language === 'hi' || lastUserMsg.includes('हिंदी')) {
      replyText = `आपके पास वर्तमान में **${context.unreconciledCount} अनिर्णीत लेन-देन (Transactions)** और कुल **₹${context.openInvoicesTotal}** के बकाया इनवॉइस हैं। कृपया 'Reconciliation' मेनू में जाकर इनका सत्यापन करें।`;
    } else if (language === 'mr') {
      replyText = `आपल्याकडे **${context.unreconciledCount} ताळमेळ न झालेले व्यवहार** आणि **₹${context.openInvoicesTotal}** ची येणे बाकी आहे.`;
    } else if (language === 'bn') {
      replyText = `আপনার বর্তমানে **${context.unreconciledCount}টি অমিল লেনদেন** এবং মোট **₹${context.openInvoicesTotal}** বকেয়া চালান রয়েছে।`;
    } else {
      replyText = `You currently have **${context.unreconciledCount} unmatched bank/UPI transactions** and **₹${context.openInvoicesTotal}** in open invoice receivables requiring review in the Reconciliation Center.`;
    }
  } else if (lastUserMsg.includes('sale') || lastUserMsg.includes('turnover') || lastUserMsg.includes('बिक्री') || lastUserMsg.includes('विक्री')) {
    if (language === 'hi') {
      replyText = `वर्तमान अवधि में आपकी दुकान **${context.shopName}** की कुल दर्ज बिक्री **₹${context.salesTotal}** है (कुल ${context.invoicesCount} इनवॉइस)। शुद्ध देय GST **₹${context.netTaxPayable}** बनता है।`;
    } else {
      replyText = `For the period (${context.currentPeriod}), total recorded sales turnover for **${context.shopName}** is **₹${context.salesTotal}** across ${context.invoicesCount} invoices, with an estimated net tax liability of **₹${context.netTaxPayable}**.`;
    }
  } else if (lastUserMsg.includes('gstr-1') || lastUserMsg.includes('gstr-3b') || lastUserMsg.includes('return') || lastUserMsg.includes('टैक्स')) {
    replyText = `For ${context.currentPeriod}, your GSTR-3B draft reflects: Outward Sales ₹${context.salesTotal}, Eligible ITC ₹${context.eligibleITC}, and Net Tax Payable ₹${context.netTaxPayable}. You can download the signed GSTR-1 JSON or GSTR-3B audit CSV from the Exports page for your Chartered Accountant.`;
  } else {
    replyText = `Namaste! I am your DIGITAX GST Copilot for **${context.shopName}** (GSTIN: ${context.gstin || 'Unregistered'}). You currently have ${context.invoicesCount} invoices (Sales: ₹${context.salesTotal}) and ${context.unreconciledCount} unmatched transactions. How can I assist with your GST calculations or bank reconciliation today?`;
  }

  return {
    text: replyText,
    source: 'grounded_deterministic',
    language,
  };
}

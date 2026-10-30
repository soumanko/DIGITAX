import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { askGnaniEvon, AssistantContext, GnaniMessage } from '../ai/gnani';

describe('GNANI EVON AI Assistant — Grounding & Safety Tests', () => {
  const context: AssistantContext = {
    shopId: 'shop-test-1',
    shopName: 'Ganesh General Store',
    gstin: '27AABCS1429B1ZB',
    state: 'Maharashtra',
    taxpayerScheme: 'regular',
    unreconciledCount: 3,
    openInvoicesTotal: '45000.00',
    currentPeriod: 'October 2026',
    salesTotal: '125000.00',
    purchasesTotal: '60000.00',
    eligibleITC: '10800.00',
    netTaxPayable: '11700.00',
    invoicesCount: 14,
    transactionsCount: 22,
  };

  test('Grounded response: ITC inquiry returns actual contextual figure (₹10800.00)', async () => {
    const messages: GnaniMessage[] = [
      { role: 'user', content: 'What is my eligible ITC for this month?' },
    ];

    const reply = await askGnaniEvon(messages, context, 'en');
    assert.ok(reply.text.includes('10800.00'), `Expected response to include 10800.00, got: ${reply.text}`);
    assert.ok(reply.text.includes('Ganesh General Store'));
  });

  test('Grounded response: Reconciled transactions inquiry cites real unreconciled count', async () => {
    const messages: GnaniMessage[] = [
      { role: 'user', content: 'Do I have any bank or UPI transactions to reconcile?' },
    ];

    const reply = await askGnaniEvon(messages, context, 'en');
    assert.ok(reply.text.includes('3 unmatched'), `Expected response to mention 3 unmatched, got: ${reply.text}`);
    assert.ok(reply.text.includes('45000.00'), `Expected response to cite open invoice balance 45000.00`);
  });

  test('Multilingual response: Hindi response correctly incorporates contextual figures', async () => {
    const messages: GnaniMessage[] = [
      { role: 'user', content: 'मेरा इस महीने का इनपुट टैक्स क्रेडिट कितना है?' },
    ];

    const reply = await askGnaniEvon(messages, context, 'hi');
    assert.ok(reply.text.includes('10800.00'), `Expected Hindi response to contain 10800.00, got: ${reply.text}`);
    assert.ok(reply.text.includes('Ganesh General Store'));
  });
});


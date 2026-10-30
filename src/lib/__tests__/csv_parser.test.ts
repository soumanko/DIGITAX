import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseBankStatementCSV } from '../csv-parser';

describe('Bank Statement & UPI CSV Parser Verification', () => {
  test('Parses multi-column debit/credit statements (HDFC/ICICI format)', () => {
    const csvData = `Date,Narration,Chq/Ref No.,Value Dt,Withdrawal Amt.,Deposit Amt.,Closing Balance
02/10/2026,UPI/62910284/APEX FMCG/SUPP,UPI62910284,02/10/2026,53100.00,,124500.00
11/10/2026,PHONEPE QR SETTLEMENT DAILY,PP993012,11/10/2026,,28450.00,152950.00
13/10/2026,CHQ 001920 MSEDCL ELECTRICITY,001920,13/10/2026,4680.00,,148270.00`;

    const res = parseBankStatementCSV(csvData);
    assert.equal(res.success, true);
    assert.equal(res.transactions.length, 3);

    // Row 1: Apex FMCG debit
    assert.equal(res.transactions[0].transaction_date, '2026-10-02');
    assert.equal(res.transactions[0].direction, 'debit');
    assert.equal(res.transactions[0].amount, '53100.00');
    assert.equal(res.transactions[0].reference_number, 'UPI62910284');

    // Row 2: PhonePe QR credit
    assert.equal(res.transactions[1].transaction_date, '2026-10-11');
    assert.equal(res.transactions[1].direction, 'credit');
    assert.equal(res.transactions[1].amount, '28450.00');
    assert.equal(res.transactions[1].source, 'upi_qr');

    // Row 3: Electricity bill debit
    assert.equal(res.transactions[2].transaction_date, '2026-10-13');
    assert.equal(res.transactions[2].direction, 'debit');
    assert.equal(res.transactions[2].amount, '4680.00');
  });

  test('Parses single-column signed amount statements (SBI / UPI format)', () => {
    const csvData = `Transaction Date,Description,Reference Number,Amount
2026-10-05,HUL DEPOT PAYMENT UPI/991204,REF991204,-45076.00
2026-10-10,BHARATPE QR RETAIL SETTLEMENT,BP77123,12450.00`;

    const res = parseBankStatementCSV(csvData);
    assert.equal(res.success, true);
    assert.equal(res.transactions.length, 2);

    assert.equal(res.transactions[0].direction, 'debit');
    assert.equal(res.transactions[0].amount, '45076.00');

    assert.equal(res.transactions[1].direction, 'credit');
    assert.equal(res.transactions[1].amount, '12450.00');
  });

  test('Rejects malformed statements with no column headers', () => {
    const badCsv = `Random text without headers
123, 456, 789`;

    const res = parseBankStatementCSV(badCsv);
    assert.equal(res.success, false);
    assert.equal(res.transactions.length, 0);
    assert.ok(res.errors.length > 0);
  });
});

export interface ParsedCsvTransaction {
  transaction_date: string;
  description: string;
  amount: string;
  direction: 'credit' | 'debit';
  reference_number?: string;
  source: 'bank_import' | 'upi_qr' | 'manual';
  category?: string;
}

export interface CsvParseResult {
  success: boolean;
  transactions: ParsedCsvTransaction[];
  errors: string[];
  totalRows: number;
}

/**
 * Parses CSV lines respecting quotes, commas, and CRLF.
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Normalizes Indian date strings into ISO format YYYY-MM-DD.
 */
function normalizeDate(dateStr: string): string | null {
  const cleaned = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = cleaned.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const d = new Date(cleaned);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Parses Bank and UPI Statement CSV files.
 */
export function parseBankStatementCSV(csvContent: string): CsvParseResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      transactions: [],
      errors: ['File is empty or contains insufficient data rows.'],
      totalRows: 0,
    };
  }

  // Identify header row
  let headerIndex = -1;
  let headers: string[] = [];

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const cols = parseCsvLine(lines[i]).map(c => c.toLowerCase());
    const hasDate = cols.some(c => c.includes('date') || c.includes('txn date'));
    const hasDesc = cols.some(c => c.includes('narration') || c.includes('description') || c.includes('particulars'));
    const hasAmt = cols.some(c => c.includes('amount') || c.includes('debit') || c.includes('credit') || c.includes('withdrawal') || c.includes('deposit'));

    if (hasDate && (hasDesc || hasAmt)) {
      headerIndex = i;
      headers = cols;
      break;
    }
  }

  if (headerIndex === -1) {
    return {
      success: false,
      transactions: [],
      errors: ['Could not detect statement column headers (expected Date, Narration/Description, and Amount/Debit/Credit columns).'],
      totalRows: lines.length,
    };
  }

  // Identify column positions
  const dateCol = headers.findIndex(c => c.includes('date') && !c.includes('value'));
  const fallbackDateCol = dateCol !== -1 ? dateCol : headers.findIndex(c => c.includes('date'));
  const descCol = headers.findIndex(c => c.includes('narration') || c.includes('description') || c.includes('particulars') || c.includes('remarks'));
  const debitCol = headers.findIndex(c => c.includes('debit') || c.includes('withdrawal') || c.includes('dr'));
  const creditCol = headers.findIndex(c => c.includes('credit') || c.includes('deposit') || c.includes('cr'));
  const amountCol = headers.findIndex(c => c.includes('amount') && !c.includes('tax') && !c.includes('net'));
  const refCol = headers.findIndex(c => c.includes('ref') || c.includes('chq') || c.includes('utr') || c.includes('txn id'));

  const transactions: ParsedCsvTransaction[] = [];
  const errors: string[] = [];

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const row = parseCsvLine(rawLine);

    if (row.length < 2 || row.every(c => c === '')) {
      continue;
    }

    const rawDate = row[fallbackDateCol] || '';
    const normDate = normalizeDate(rawDate);

    if (!normDate) {
      // Skip summary or footer lines (e.g. "Total", "Closing Balance")
      continue;
    }

    const description = (row[descCol] || 'Bank Transaction').trim();
    const reference = refCol !== -1 ? row[refCol]?.trim() : undefined;

    let amount = '0.00';
    let direction: 'credit' | 'debit' = 'credit';

    if (debitCol !== -1 && creditCol !== -1) {
      const debitRaw = (row[debitCol] || '').replace(/[^0-9.]/g, '');
      const creditRaw = (row[creditCol] || '').replace(/[^0-9.]/g, '');

      const debitVal = parseFloat(debitRaw) || 0;
      const creditVal = parseFloat(creditRaw) || 0;

      if (debitVal > 0) {
        amount = debitVal.toFixed(2);
        direction = 'debit';
      } else if (creditVal > 0) {
        amount = creditVal.toFixed(2);
        direction = 'credit';
      } else {
        continue; // Zero amount transaction
      }
    } else if (amountCol !== -1) {
      const cleanAmt = (row[amountCol] || '').replace(/[₹,\s]/g, '');
      const isNeg = cleanAmt.startsWith('-');
      const num = Math.abs(parseFloat(cleanAmt) || 0);

      if (num === 0) continue;

      amount = num.toFixed(2);
      direction = isNeg ? 'debit' : 'credit';
    } else {
      errors.push(`Row ${i + 1}: Unable to parse transaction amount.`);
      continue;
    }

    // Determine category heuristically
    let category = 'business_sale';
    const lowerDesc = description.toLowerCase();
    if (direction === 'debit') {
      if (lowerDesc.includes('gst') || lowerDesc.includes('challan') || lowerDesc.includes('tax')) {
        category = 'supplier_payment';
      } else {
        category = 'business_purchase';
      }
    } else {
      if (lowerDesc.includes('settlement') || lowerDesc.includes('upi') || lowerDesc.includes('qr')) {
        category = 'business_sale';
      }
    }

    const isUpiOrQr =
      lowerDesc.includes('upi') ||
      lowerDesc.includes('qr') ||
      lowerDesc.includes('phonepe') ||
      lowerDesc.includes('paytm') ||
      lowerDesc.includes('gpay') ||
      lowerDesc.includes('bharatpe');

    transactions.push({
      transaction_date: normDate,
      description,
      amount,
      direction,
      reference_number: reference || undefined,
      source: isUpiOrQr ? 'upi_qr' : 'bank_import',
      category,
    });
  }

  return {
    success: transactions.length > 0,
    transactions,
    errors,
    totalRows: lines.length - (headerIndex + 1),
  };
}

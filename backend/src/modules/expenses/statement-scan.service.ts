export type ScanSummary = {
  detectedEntries: number;
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  estimatedMonthlyOutflow: number;
  estimatedMonths: number;
  sampleAmounts: number[];
};

const amountRegex = /-?\(?\s*(?:INR|Rs\.?|₹)?\s*\d[\d,]*(?:\.\d{1,2})?\s*\)?/gi;
const dateRegex = /(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/g;
const drAmountRegex = /(?:dr|debit)\s*[:\-]?\s*(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i;
const crAmountRegex = /(?:cr|credit)\s*[:\-]?\s*(?:inr|rs\.?|₹)?\s*([\d,]+(?:\.\d{1,2})?)/i;

const debitKeywords = [
  'debit',
  'dr',
  'withdraw',
  'withdrawal',
  'purchase',
  'upi',
  'bill',
  'payment',
  'pos',
  'emi',
  'charges',
  'atm',
  'debit card',
  'imps',
  'neft',
  'rtgs',
];
const creditKeywords = ['credit', 'cr', 'salary', 'refund', 'interest', 'cashback', 'deposit', 'received'];

const normalizeOcrContent = (content: string): string => {
  return content
    .replace(/\u00a0/g, ' ')
    .replace(/[|]/g, ' ')
    .replace(/\bINR\b/gi, ' INR ')
    .replace(/[Oo](?=\d)/g, '0')
    .replace(/(?<=\d)[Oo]/g, '0')
    .replace(/\s+/g, ' ')
    .replace(/\r/g, '\n');
};

const parseTaggedAmount = (line: string, regex: RegExp): number | null => {
  const match = line.match(regex);
  if (!match?.[1]) {
    return null;
  }
  return cleanAmount(match[1]);
};

const cleanAmount = (raw: string): number | null => {
  const normalized = raw.replace(/[₹,\s]/g, '').replace(/\(/g, '-').replace(/\)/g, '');
  const onlyNumber = normalized.replace(/[^0-9.-]/g, '');
  const parsed = Number(onlyNumber);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
};

const parseDate = (value: string): Date | null => {
  const parts = value.split(/[\/\-.]/).map((v) => Number(v));
  if (parts.length !== 3 || parts.some((v) => !Number.isFinite(v))) {
    return null;
  }

  let [a, b, c] = parts;
  if (c < 100) {
    c += 2000;
  }

  const date = new Date(c, b - 1, a);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
};

const estimateMonthsFromDates = (content: string): number => {
  const matches = [...content.matchAll(dateRegex)].map((m) => m[1]).filter(Boolean) as string[];
  const parsed = matches.map(parseDate).filter((d): d is Date => !!d);

  if (parsed.length < 2) {
    return 1;
  }

  const minTime = Math.min(...parsed.map((d) => d.getTime()));
  const maxTime = Math.max(...parsed.map((d) => d.getTime()));
  const diffDays = Math.max(1, Math.round((maxTime - minTime) / (24 * 60 * 60 * 1000)));
  return Math.max(1, Math.min(12, Math.ceil(diffDays / 30)));
};

export const scanStatementContent = (content: string): ScanSummary => {
  const normalizedContent = normalizeOcrContent(content);

  const lines = normalizedContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  let totalInflow = 0;
  let totalOutflow = 0;
  const detectedAmounts: number[] = [];

  lines.forEach((line) => {
    const drTaggedAmount = parseTaggedAmount(line, drAmountRegex);
    const crTaggedAmount = parseTaggedAmount(line, crAmountRegex);

    if (drTaggedAmount !== null || crTaggedAmount !== null) {
      if (drTaggedAmount !== null) {
        totalOutflow += Math.abs(drTaggedAmount);
        detectedAmounts.push(-Math.abs(drTaggedAmount));
      }
      if (crTaggedAmount !== null) {
        totalInflow += Math.abs(crTaggedAmount);
        detectedAmounts.push(Math.abs(crTaggedAmount));
      }
      return;
    }

    const lineAmounts = [...line.matchAll(amountRegex)]
      .map((m) => cleanAmount(m[0]))
      .filter((v): v is number => v !== null);

    if (!lineAmounts.length) {
      return;
    }

    const amount = lineAmounts[lineAmounts.length - 1];
    const lower = line.toLowerCase();

    const isDebitByWord = debitKeywords.some((word) => lower.includes(word));
    const isCreditByWord = creditKeywords.some((word) => lower.includes(word));

    if (isDebitByWord && !isCreditByWord) {
      totalOutflow += Math.abs(amount);
      detectedAmounts.push(-Math.abs(amount));
      return;
    }

    if (isCreditByWord && !isDebitByWord) {
      totalInflow += Math.abs(amount);
      detectedAmounts.push(Math.abs(amount));
      return;
    }

    if (amount < 0) {
      totalOutflow += Math.abs(amount);
      detectedAmounts.push(amount);
      return;
    }

    // Ambiguous entries are treated as outflow for conservative budgeting.
    totalOutflow += Math.abs(amount);
    detectedAmounts.push(-Math.abs(amount));
  });

  const estimatedMonths = estimateMonthsFromDates(normalizedContent);
  const estimatedMonthlyOutflow = totalOutflow / estimatedMonths;

  return {
    detectedEntries: detectedAmounts.length,
    totalInflow: Math.round(totalInflow * 100) / 100,
    totalOutflow: Math.round(totalOutflow * 100) / 100,
    netCashflow: Math.round((totalInflow - totalOutflow) * 100) / 100,
    estimatedMonthlyOutflow: Math.round(estimatedMonthlyOutflow * 100) / 100,
    estimatedMonths,
    sampleAmounts: detectedAmounts.slice(0, 15),
  };
};

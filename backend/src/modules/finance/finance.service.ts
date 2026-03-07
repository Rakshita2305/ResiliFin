import { Types } from 'mongoose';

import { AuditLogModel } from '../audit/audit-log.model';
import { BillSubscriptionEntryModel } from './bill-subscription.model';
import { InsuranceEntryModel } from './insurance.model';
import { InvestmentEntryModel } from './investment.model';
import { LoanEntryModel } from './loan.model';
import { SavingsEntryModel } from './savings.model';

const parseDateOrUndefined = (value?: string): Date | undefined => {
  if (!value) {
    return undefined;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date value');
  }
  return parsed;
};

const parseDueDayOfMonth = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const asNumber = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(asNumber) || asNumber < 1 || asNumber > 31) {
    throw new Error('dueDayOfMonth must be an integer between 1 and 31');
  }

  return asNumber;
};

const deriveDueDateFromDay = (dueDayOfMonth: number) => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const endOfMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const clampedDay = Math.min(dueDayOfMonth, endOfMonth);
  return new Date(Date.UTC(year, month, clampedDay, 12, 0, 0));
};

const assertWithinAllowedDateRange = (value: Date | undefined, field: string) => {
  if (!value) {
    return;
  }

  const year = value.getUTCFullYear();
  if (year < 1950 || year > 2100) {
    throw new Error(`${field} must be between year 1950 and 2100`);
  }
};

// Retain backward compatibility for existing call sites.
const assertWithinLastFourYears = assertWithinAllowedDateRange;

const yearsBetween = (from: Date, to: Date) => {
  const diffMs = to.getTime() - from.getTime();
  return Math.max(0, diffMs / (365.25 * 24 * 60 * 60 * 1000));
};

const assertNonNegative = (value: unknown, field: string, required = false) => {
  if (value === undefined || value === null) {
    if (required) {
      throw new Error(`${field} is required`);
    }
    return;
  }
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
};

const parseNonNegativeNumber = (value: unknown, field: string, required = false): number | undefined => {
  if (value === undefined || value === null || value === '') {
    if (required) {
      throw new Error(`${field} is required`);
    }
    return undefined;
  }

  const numeric = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }

  return numeric;
};

const parsePositiveInteger = (value: unknown, field: string): number => {
  const numeric = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(numeric) || numeric < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
  return numeric;
};

const savingsTypes = new Set(['normal', 'emergency', 'fd', 'rd', 'sip', 'ppf', 'other']);
const investmentTypes = new Set([
  'sip',
  'stocks',
  'mutual-funds',
  'gold',
  'real-estate',
  'bonds',
  'ppf',
  'elss',
  'etf',
  'other',
]);
const investmentModes = new Set(['one-time', 'monthly', 'yearly']);
const insuranceTypes = new Set([
  'health',
  'life',
  'vehicle',
  'home',
  'travel',
  'term-life',
  'personal-accident',
  'gadget',
  'business-liability',
  'other',
]);
const riskLevels = new Set(['low', 'medium', 'high']);
const premiumFrequency = new Set(['monthly', 'quarterly', 'yearly']);
const insurancePaymentModes = new Set(['monthly', 'yearly']);
const loanTypes = new Set(['home', 'personal', 'vehicle', 'education', 'business', 'gold', 'credit-card', 'other']);
const loanPaymentModes = new Set(['monthly', 'yearly']);
const billEntryTypes = new Set(['bill', 'subscription']);
const billCycles = new Set(['one-time', 'monthly', 'yearly']);
const billStatuses = new Set(['active', 'cancelled']);

export const createSavingsEntry = async (params: { userId: string; input: any; reasonTag?: string }) => {
  const input = params.input;
  if (!input?.type || typeof input.type !== 'string' || !savingsTypes.has(input.type)) {
    throw new Error('type is required');
  }
  if (!input?.instrumentName || typeof input.instrumentName !== 'string') {
    throw new Error('instrumentName is required');
  }
  assertNonNegative(input.amount, 'amount', true);
  assertNonNegative(input.interestRate, 'interestRate');

  const created = await SavingsEntryModel.create({
    userId: new Types.ObjectId(params.userId),
    type: input.type,
    instrumentName: input.instrumentName,
    amount: input.amount,
    startDate: parseDateOrUndefined(input.startDate),
    interestRate: input.interestRate,
    maturityDate: parseDateOrUndefined(input.maturityDate),
    notes: input.notes,
  });

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'savings',
    entityId: created._id,
    action: 'create',
    reasonTag: params.reasonTag,
    after: created.toObject(),
  });

  return created;
};

export const listSavingsEntries = async (userId: string) =>
  SavingsEntryModel.find({ userId }).sort({ createdAt: -1 });

export const listSavingsEntriesWithProjection = async (userId: string) => {
  const entries = await listSavingsEntries(userId);
  const now = new Date();

  return entries.map((entry) => {
    const principal = entry.amount ?? 0;
    const rate = (entry.interestRate ?? 0) / 100;
    const start = entry.startDate ?? entry.createdAt;
    const end = entry.maturityDate ?? now;
    const years = yearsBetween(start, end);
    const projectedAmount = principal * Math.pow(1 + rate, years);
    const daysToMaturity = entry.maturityDate
      ? Math.ceil((entry.maturityDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      : null;

    return {
      ...entry.toObject(),
      projection: {
        projectedAmount: Math.round(projectedAmount * 100) / 100,
        daysToMaturity,
      },
    };
  });
};

export const updateSavingsEntry = async (params: { userId: string; entryId: string; input: any; reasonTag?: string }) => {
  const existing = await SavingsEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Savings entry not found');
  }

  const merged = {
    type: params.input.type ?? existing.type,
    instrumentName: params.input.instrumentName ?? existing.instrumentName,
    amount: params.input.amount ?? existing.amount,
    startDate: params.input.startDate ?? existing.startDate?.toISOString(),
    interestRate: params.input.interestRate ?? existing.interestRate,
    maturityDate: params.input.maturityDate ?? existing.maturityDate?.toISOString(),
    notes: params.input.notes ?? existing.notes,
  };

  if (!savingsTypes.has(merged.type)) {
    throw new Error('type is invalid');
  }
  if (typeof merged.instrumentName !== 'string' || !merged.instrumentName.trim()) {
    throw new Error('instrumentName is required');
  }
  assertNonNegative(merged.amount, 'amount', true);
  assertNonNegative(merged.interestRate, 'interestRate');

  existing.type = merged.type;
  existing.instrumentName = merged.instrumentName;
  existing.amount = merged.amount;
  existing.startDate = parseDateOrUndefined(merged.startDate);
  existing.interestRate = merged.interestRate;
  existing.maturityDate = parseDateOrUndefined(merged.maturityDate);
  existing.notes = merged.notes;

  await existing.save();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'savings',
    entityId: existing._id,
    action: 'update',
    reasonTag: params.reasonTag,
    after: existing.toObject(),
  });

  return existing;
};

export const deleteSavingsEntry = async (params: { userId: string; entryId: string; reasonTag?: string }) => {
  const existing = await SavingsEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Savings entry not found');
  }

  const before = existing.toObject();
  await existing.deleteOne();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'savings',
    entityId: before._id,
    action: 'delete',
    reasonTag: params.reasonTag,
    before,
  });

  return { deleted: true };
};

export const createInvestmentEntry = async (params: { userId: string; input: any; reasonTag?: string }) => {
  const input = params.input;
  if (!input?.type || typeof input.type !== 'string' || !investmentTypes.has(input.type)) {
    throw new Error('type is required');
  }
  if (!input?.instrumentName || typeof input.instrumentName !== 'string' || !input.instrumentName.trim()) {
    throw new Error('instrumentName is required');
  }
  const investmentMode =
    typeof input.investmentMode === 'string' && input.investmentMode.trim()
      ? input.investmentMode.trim()
      : 'one-time';
  if (!investmentModes.has(investmentMode)) {
    throw new Error('investmentMode is invalid');
  }
  const investedAmount = parseNonNegativeNumber(input.investedAmount, 'investedAmount', true)!;
  const currentValue = parseNonNegativeNumber(input.currentValue, 'currentValue');
  const units = parseNonNegativeNumber(input.units, 'units');
  const isRecurringMode = investmentMode === 'monthly' || investmentMode === 'yearly';
  const recurringAmount = isRecurringMode
    ? parseNonNegativeNumber(input.recurringAmount ?? investedAmount, 'recurringAmount', true)
    : parseNonNegativeNumber(input.recurringAmount, 'recurringAmount');
  if (input.riskLevel !== undefined && !riskLevels.has(input.riskLevel)) {
    throw new Error('riskLevel is invalid');
  }
  const isOpenEnded = input.isOpenEnded !== undefined ? Boolean(input.isOpenEnded) : true;
  if (!isOpenEnded && !input.endDate) {
    throw new Error('endDate is required when isOpenEnded is false');
  }
  const startDate = parseDateOrUndefined(input.startDate);
  const endDate = isOpenEnded ? undefined : parseDateOrUndefined(input.endDate);
  assertWithinLastFourYears(startDate, 'startDate');
  assertWithinLastFourYears(endDate, 'endDate');

  const created = await InvestmentEntryModel.create({
    userId: new Types.ObjectId(params.userId),
    type: input.type,
    investmentMode,
    instrumentName: input.instrumentName,
    investedAmount,
    currentValue,
    assetSymbol: input.assetSymbol,
    units,
    lastMarketPrice: input.lastMarketPrice,
    lastPriceUpdatedAt: parseDateOrUndefined(input.lastPriceUpdatedAt),
    recurringAmount: isRecurringMode ? recurringAmount : undefined,
    startDate,
    endDate,
    isOpenEnded,
    riskLevel: input.riskLevel,
    notes: input.notes,
  });

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'investment',
    entityId: created._id,
    action: 'create',
    reasonTag: params.reasonTag,
    after: created.toObject(),
  });

  return created;
};

export const listInvestmentEntries = async (userId: string) =>
  InvestmentEntryModel.find({ userId }).sort({ createdAt: -1 });

export const updateInvestmentEntry = async (params: {
  userId: string;
  entryId: string;
  input: any;
  reasonTag?: string;
}) => {
  const existing = await InvestmentEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Investment entry not found');
  }

  const merged = {
    type: params.input.type ?? existing.type,
    investmentMode: params.input.investmentMode ?? existing.investmentMode ?? 'one-time',
    instrumentName: params.input.instrumentName ?? existing.instrumentName,
    investedAmount: params.input.investedAmount ?? existing.investedAmount,
    currentValue: params.input.currentValue ?? existing.currentValue,
    assetSymbol: params.input.assetSymbol ?? existing.assetSymbol,
    units: params.input.units ?? existing.units,
    lastMarketPrice: params.input.lastMarketPrice ?? existing.lastMarketPrice,
    lastPriceUpdatedAt: params.input.lastPriceUpdatedAt ?? existing.lastPriceUpdatedAt?.toISOString(),
    recurringAmount: params.input.recurringAmount ?? existing.recurringAmount,
    startDate: params.input.startDate ?? existing.startDate?.toISOString(),
    endDate: params.input.endDate ?? existing.endDate?.toISOString(),
    isOpenEnded: params.input.isOpenEnded ?? existing.isOpenEnded,
    riskLevel: params.input.riskLevel ?? existing.riskLevel,
    notes: params.input.notes ?? existing.notes,
  };

  if (!investmentTypes.has(merged.type)) {
    throw new Error('type is invalid');
  }
  if (!investmentModes.has(merged.investmentMode)) {
    throw new Error('investmentMode is invalid');
  }
  if (typeof merged.instrumentName !== 'string' || !merged.instrumentName.trim()) {
    throw new Error('instrumentName is required');
  }
  const investedAmount = parseNonNegativeNumber(merged.investedAmount, 'investedAmount', true)!;
  const currentValue = parseNonNegativeNumber(merged.currentValue, 'currentValue');
  const units = parseNonNegativeNumber(merged.units, 'units');
  const recurringMode = merged.investmentMode === 'monthly' || merged.investmentMode === 'yearly';
  const normalizedRecurringAmount = recurringMode
    ? parseNonNegativeNumber(merged.recurringAmount ?? investedAmount, 'recurringAmount', true)
    : undefined;
  if (merged.riskLevel !== undefined && !riskLevels.has(merged.riskLevel)) {
    throw new Error('riskLevel is invalid');
  }
  if (!merged.isOpenEnded && !merged.endDate) {
    throw new Error('endDate is required when isOpenEnded is false');
  }
  const nextStartDate = parseDateOrUndefined(merged.startDate);
  const nextEndDate = merged.isOpenEnded ? undefined : parseDateOrUndefined(merged.endDate);
  assertWithinLastFourYears(nextStartDate, 'startDate');
  assertWithinLastFourYears(nextEndDate, 'endDate');

  existing.type = merged.type;
  existing.investmentMode = merged.investmentMode;
  existing.instrumentName = merged.instrumentName;
  existing.investedAmount = investedAmount;
  existing.currentValue = currentValue;
  existing.assetSymbol = merged.assetSymbol;
  existing.units = units;
  existing.lastMarketPrice = merged.lastMarketPrice;
  existing.lastPriceUpdatedAt = parseDateOrUndefined(merged.lastPriceUpdatedAt);
  existing.recurringAmount = normalizedRecurringAmount;
  existing.startDate = nextStartDate;
  existing.endDate = nextEndDate;
  existing.isOpenEnded = Boolean(merged.isOpenEnded);
  existing.riskLevel = merged.riskLevel;
  existing.notes = merged.notes;

  await existing.save();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'investment',
    entityId: existing._id,
    action: 'update',
    reasonTag: params.reasonTag,
    after: existing.toObject(),
  });

  return existing;
};

export const deleteInvestmentEntry = async (params: { userId: string; entryId: string; reasonTag?: string }) => {
  const existing = await InvestmentEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Investment entry not found');
  }

  const before = existing.toObject();
  await existing.deleteOne();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'investment',
    entityId: before._id,
    action: 'delete',
    reasonTag: params.reasonTag,
    before,
  });

  return { deleted: true };
};

export const createInsuranceEntry = async (params: { userId: string; input: any; reasonTag?: string }) => {
  const input = params.input;
  if (!input?.type || typeof input.type !== 'string' || !insuranceTypes.has(input.type)) {
    throw new Error('type is required');
  }
  if (!input?.policyName || typeof input.policyName !== 'string' || !input.policyName.trim()) {
    throw new Error('policyName is required');
  }
  if (!input?.providerName || typeof input.providerName !== 'string') {
    throw new Error('providerName is required');
  }
  const coverageAmount = parseNonNegativeNumber(input.coverageAmount, 'coverageAmount');
  const premiumAmount = parseNonNegativeNumber(input.premiumAmount, 'premiumAmount');
  const maxReturnAmount = parseNonNegativeNumber(input.maxReturnAmount, 'maxReturnAmount');
  const paymentMode =
    typeof input.paymentMode === 'string'
      ? input.paymentMode.trim().toLowerCase()
      : typeof input.premiumFrequency === 'string'
        ? input.premiumFrequency.trim().toLowerCase()
        : undefined;
  if (!paymentMode || !insurancePaymentModes.has(paymentMode)) {
    throw new Error('paymentMode is required and must be monthly or yearly');
  }

  const policyStartDate = parseDateOrUndefined(input.policyStartDate);
  const policyEndDate = parseDateOrUndefined(input.policyEndDate);
  const paymentDate = parseDateOrUndefined(input.paymentDate ?? input.nextDebitDate);
  assertWithinLastFourYears(policyStartDate, 'policyStartDate');
  assertWithinLastFourYears(policyEndDate, 'policyEndDate');

  const created = await InsuranceEntryModel.create({
    userId: new Types.ObjectId(params.userId),
    type: input.type,
    policyName: input.policyName,
    providerName: input.providerName,
    coverageAmount,
    premiumAmount,
    maxReturnAmount,
    paymentMode,
    paymentDate,
    premiumFrequency: paymentMode,
    policyStartDate,
    policyEndDate,
    nextDebitDate: paymentDate,
    renewalDate: parseDateOrUndefined(input.renewalDate),
    notes: input.notes,
  });

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'insurance',
    entityId: created._id,
    action: 'create',
    reasonTag: params.reasonTag,
    after: created.toObject(),
  });

  return created;
};

export const listInsuranceEntries = async (userId: string) =>
  InsuranceEntryModel.find({ userId }).sort({ createdAt: -1 });

export const updateInsuranceEntry = async (params: {
  userId: string;
  entryId: string;
  input: any;
  reasonTag?: string;
}) => {
  const existing = await InsuranceEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Insurance entry not found');
  }

  const merged = {
    type: params.input.type ?? existing.type,
    policyName: params.input.policyName ?? existing.policyName,
    providerName: params.input.providerName ?? existing.providerName,
    coverageAmount: params.input.coverageAmount ?? existing.coverageAmount,
    premiumAmount: params.input.premiumAmount ?? existing.premiumAmount,
    maxReturnAmount: params.input.maxReturnAmount ?? existing.maxReturnAmount,
    paymentMode:
      params.input.paymentMode ?? params.input.premiumFrequency ?? existing.paymentMode ?? existing.premiumFrequency,
    paymentDate: params.input.paymentDate ?? params.input.nextDebitDate ?? existing.paymentDate?.toISOString(),
    premiumFrequency: params.input.premiumFrequency ?? existing.premiumFrequency,
    policyStartDate: params.input.policyStartDate ?? existing.policyStartDate?.toISOString(),
    policyEndDate: params.input.policyEndDate ?? existing.policyEndDate?.toISOString(),
    nextDebitDate: params.input.nextDebitDate ?? existing.nextDebitDate?.toISOString(),
    renewalDate: params.input.renewalDate ?? existing.renewalDate?.toISOString(),
    notes: params.input.notes ?? existing.notes,
  };

  if (!insuranceTypes.has(merged.type)) {
    throw new Error('type is invalid');
  }
  if (typeof merged.policyName !== 'string' || !merged.policyName.trim()) {
    throw new Error('policyName is required');
  }
  if (typeof merged.providerName !== 'string' || !merged.providerName.trim()) {
    throw new Error('providerName is required');
  }
  const coverageAmount = parseNonNegativeNumber(merged.coverageAmount, 'coverageAmount');
  const premiumAmount = parseNonNegativeNumber(merged.premiumAmount, 'premiumAmount');
  const maxReturnAmount = parseNonNegativeNumber(merged.maxReturnAmount, 'maxReturnAmount');
  const paymentMode = typeof merged.paymentMode === 'string' ? merged.paymentMode.trim().toLowerCase() : merged.paymentMode;
  if (!paymentMode || !insurancePaymentModes.has(paymentMode)) {
    throw new Error('paymentMode is required and must be monthly or yearly');
  }

  const nextPolicyStartDate = parseDateOrUndefined(merged.policyStartDate);
  const nextPolicyEndDate = parseDateOrUndefined(merged.policyEndDate);
  const nextPaymentDate = parseDateOrUndefined(merged.paymentDate);
  assertWithinLastFourYears(nextPolicyStartDate, 'policyStartDate');
  assertWithinLastFourYears(nextPolicyEndDate, 'policyEndDate');

  existing.type = merged.type;
  existing.policyName = merged.policyName;
  existing.providerName = merged.providerName;
  existing.coverageAmount = coverageAmount;
  existing.premiumAmount = premiumAmount;
  existing.maxReturnAmount = maxReturnAmount;
  existing.paymentMode = paymentMode;
  existing.paymentDate = nextPaymentDate;
  existing.premiumFrequency = paymentMode;
  existing.policyStartDate = nextPolicyStartDate;
  existing.policyEndDate = nextPolicyEndDate;
  existing.nextDebitDate = nextPaymentDate;
  existing.renewalDate = parseDateOrUndefined(merged.renewalDate);
  existing.notes = merged.notes;

  await existing.save();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'insurance',
    entityId: existing._id,
    action: 'update',
    reasonTag: params.reasonTag,
    after: existing.toObject(),
  });

  return existing;
};

export const refreshInvestmentFromMarket = async (params: {
  userId: string;
  entryId: string;
  reasonTag?: string;
}) => {
  const existing = await InvestmentEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Investment entry not found');
  }

  const symbol = existing.assetSymbol?.trim().toUpperCase();
  if (!symbol) {
    throw new Error('assetSymbol is required for market refresh');
  }

  const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch market quote');
  }

  const data = (await response.json()) as {
    quoteResponse?: { result?: Array<{ regularMarketPrice?: number }> };
  };

  const price = data.quoteResponse?.result?.[0]?.regularMarketPrice;
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    throw new Error('Invalid market price received');
  }

  existing.lastMarketPrice = price;
  existing.lastPriceUpdatedAt = new Date();
  if (existing.units && existing.units > 0) {
    existing.currentValue = Math.round(existing.units * price * 100) / 100;
  }

  await existing.save();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'investment',
    entityId: existing._id,
    action: 'update',
    reasonTag: params.reasonTag ?? 'investment-market-refresh',
    after: existing.toObject(),
  });

  return existing;
};

export const deleteInsuranceEntry = async (params: { userId: string; entryId: string; reasonTag?: string }) => {
  const existing = await InsuranceEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Insurance entry not found');
  }

  const before = existing.toObject();
  await existing.deleteOne();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'insurance',
    entityId: before._id,
    action: 'delete',
    reasonTag: params.reasonTag,
    before,
  });

  return { deleted: true };
};

export const createLoanEntry = async (params: { userId: string; input: any; reasonTag?: string }) => {
  const input = params.input;
  if (!input?.loanType || typeof input.loanType !== 'string' || !loanTypes.has(input.loanType)) {
    throw new Error('loanType is required');
  }
  if (!input?.loanName || typeof input.loanName !== 'string' || !input.loanName.trim()) {
    throw new Error('loanName is required');
  }
  if (!input?.lenderName || typeof input.lenderName !== 'string' || !input.lenderName.trim()) {
    throw new Error('lenderName is required');
  }

  const principalAmount = parseNonNegativeNumber(input.principalAmount, 'principalAmount', true)!;
  const outstandingAmount = parseNonNegativeNumber(input.outstandingAmount, 'outstandingAmount');
  const interestRate = parseNonNegativeNumber(input.interestRate, 'interestRate');
  const emiAmount = parseNonNegativeNumber(input.emiAmount, 'emiAmount', true)!;
  const tenureMonths = parsePositiveInteger(input.tenureMonths, 'tenureMonths');

  const paymentMode = typeof input.paymentMode === 'string' ? input.paymentMode.trim().toLowerCase() : 'monthly';
  if (!loanPaymentModes.has(paymentMode)) {
    throw new Error('paymentMode is invalid');
  }

  const dueDayOfMonth = parseDueDayOfMonth(input.dueDayOfMonth);
  const paymentDueDate = parseDateOrUndefined(input.paymentDueDate) ??
    (paymentMode === 'monthly' ? deriveDueDateFromDay(dueDayOfMonth ?? new Date().getUTCDate()) : undefined);
  if (!paymentDueDate) {
    throw new Error(
      paymentMode === 'monthly'
        ? 'For monthly loans, provide dueDayOfMonth (1-31) or paymentDueDate'
        : 'paymentDueDate is required',
    );
  }
  const loanStartDate = parseDateOrUndefined(input.loanStartDate);
  const loanEndDate = parseDateOrUndefined(input.loanEndDate);
  assertWithinLastFourYears(loanStartDate, 'loanStartDate');
  assertWithinLastFourYears(loanEndDate, 'loanEndDate');

  const created = await LoanEntryModel.create({
    userId: new Types.ObjectId(params.userId),
    loanType: input.loanType,
    loanName: input.loanName,
    lenderName: input.lenderName,
    principalAmount,
    outstandingAmount,
    interestRate,
    tenureMonths,
    emiAmount,
    paymentMode,
    paymentDueDate,
    dueDayOfMonth,
    loanStartDate,
    loanEndDate,
    notes: input.notes,
  });

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'loan',
    entityId: created._id,
    action: 'create',
    reasonTag: params.reasonTag,
    after: created.toObject(),
  });

  return created;
};

export const listLoanEntries = async (userId: string) => LoanEntryModel.find({ userId }).sort({ createdAt: -1 });

export const updateLoanEntry = async (params: { userId: string; entryId: string; input: any; reasonTag?: string }) => {
  const existing = await LoanEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Loan entry not found');
  }

  const merged = {
    loanType: params.input.loanType ?? existing.loanType,
    loanName: params.input.loanName ?? existing.loanName,
    lenderName: params.input.lenderName ?? existing.lenderName,
    principalAmount: params.input.principalAmount ?? existing.principalAmount,
    outstandingAmount: params.input.outstandingAmount ?? existing.outstandingAmount,
    interestRate: params.input.interestRate ?? existing.interestRate,
    tenureMonths: params.input.tenureMonths ?? existing.tenureMonths,
    emiAmount: params.input.emiAmount ?? existing.emiAmount,
    paymentMode: params.input.paymentMode ?? existing.paymentMode,
    paymentDueDate: params.input.paymentDueDate ?? existing.paymentDueDate?.toISOString(),
    dueDayOfMonth: params.input.dueDayOfMonth ?? existing.dueDayOfMonth,
    loanStartDate: params.input.loanStartDate ?? existing.loanStartDate?.toISOString(),
    loanEndDate: params.input.loanEndDate ?? existing.loanEndDate?.toISOString(),
    notes: params.input.notes ?? existing.notes,
  };

  if (!loanTypes.has(merged.loanType)) {
    throw new Error('loanType is invalid');
  }
  if (typeof merged.loanName !== 'string' || !merged.loanName.trim()) {
    throw new Error('loanName is required');
  }
  if (typeof merged.lenderName !== 'string' || !merged.lenderName.trim()) {
    throw new Error('lenderName is required');
  }

  const principalAmount = parseNonNegativeNumber(merged.principalAmount, 'principalAmount', true)!;
  const outstandingAmount = parseNonNegativeNumber(merged.outstandingAmount, 'outstandingAmount');
  const interestRate = parseNonNegativeNumber(merged.interestRate, 'interestRate');
  const emiAmount = parseNonNegativeNumber(merged.emiAmount, 'emiAmount', true)!;
  const tenureMonths = parsePositiveInteger(merged.tenureMonths, 'tenureMonths');
  const paymentMode = typeof merged.paymentMode === 'string' ? merged.paymentMode.trim().toLowerCase() : merged.paymentMode;
  if (!loanPaymentModes.has(paymentMode)) {
    throw new Error('paymentMode is invalid');
  }

  const nextDueDayOfMonth = parseDueDayOfMonth(merged.dueDayOfMonth);

  const nextPaymentDueDate = parseDateOrUndefined(merged.paymentDueDate) ??
    (paymentMode === 'monthly' ? deriveDueDateFromDay(nextDueDayOfMonth ?? new Date().getUTCDate()) : undefined);
  if (!nextPaymentDueDate) {
    throw new Error(
      paymentMode === 'monthly'
        ? 'For monthly loans, provide dueDayOfMonth (1-31) or paymentDueDate'
        : 'paymentDueDate is required',
    );
  }
  const nextLoanStartDate = parseDateOrUndefined(merged.loanStartDate);
  const nextLoanEndDate = parseDateOrUndefined(merged.loanEndDate);
  assertWithinLastFourYears(nextLoanStartDate, 'loanStartDate');
  assertWithinLastFourYears(nextLoanEndDate, 'loanEndDate');

  existing.loanType = merged.loanType;
  existing.loanName = merged.loanName;
  existing.lenderName = merged.lenderName;
  existing.principalAmount = principalAmount;
  existing.outstandingAmount = outstandingAmount;
  existing.interestRate = interestRate;
  existing.tenureMonths = tenureMonths;
  existing.emiAmount = emiAmount;
  existing.paymentMode = paymentMode;
  existing.paymentDueDate = nextPaymentDueDate;
  existing.dueDayOfMonth = nextDueDayOfMonth;
  existing.loanStartDate = nextLoanStartDate;
  existing.loanEndDate = nextLoanEndDate;
  existing.notes = merged.notes;

  await existing.save();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'loan',
    entityId: existing._id,
    action: 'update',
    reasonTag: params.reasonTag,
    after: existing.toObject(),
  });

  return existing;
};

export const deleteLoanEntry = async (params: { userId: string; entryId: string; reasonTag?: string }) => {
  const existing = await LoanEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Loan entry not found');
  }

  const before = existing.toObject();
  await existing.deleteOne();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'loan',
    entityId: before._id,
    action: 'delete',
    reasonTag: params.reasonTag,
    before,
  });

  return { deleted: true };
};

export const createBillSubscriptionEntry = async (params: { userId: string; input: any; reasonTag?: string }) => {
  const input = params.input;
  if (!input?.entryType || typeof input.entryType !== 'string' || !billEntryTypes.has(input.entryType)) {
    throw new Error('entryType is required');
  }
  if (!input?.title || typeof input.title !== 'string' || !input.title.trim()) {
    throw new Error('title is required');
  }

  const amount = parseNonNegativeNumber(input.amount, 'amount', true)!;

  const cycle = typeof input.cycle === 'string' ? input.cycle.trim().toLowerCase() : 'one-time';
  if (!billCycles.has(cycle)) {
    throw new Error('cycle is invalid');
  }

  const autopayEnabled = Boolean(input.autopayEnabled);
  if (input.entryType === 'subscription' && cycle === 'one-time') {
    throw new Error('subscription cycle cannot be one-time');
  }
  if (input.entryType === 'subscription' && !autopayEnabled) {
    throw new Error('subscription requires autopayEnabled true');
  }
  if (input.entryType === 'bill' && autopayEnabled) {
    throw new Error('bill cannot have autopayEnabled true');
  }

  const paymentDueDate = parseDateOrUndefined(input.paymentDueDate) ?? new Date();
  const startDate = parseDateOrUndefined(input.startDate);
  const endDate = parseDateOrUndefined(input.endDate);
  assertWithinLastFourYears(paymentDueDate, 'paymentDueDate');
  assertWithinLastFourYears(startDate, 'startDate');
  assertWithinLastFourYears(endDate, 'endDate');
  if (startDate && endDate && endDate < startDate) {
    throw new Error('endDate cannot be before startDate');
  }

  const status = typeof input.status === 'string' ? input.status.trim().toLowerCase() : 'active';
  if (!billStatuses.has(status)) {
    throw new Error('status is invalid');
  }

  const includeInMonthlyExpense =
    input.includeInMonthlyExpense === undefined ? true : Boolean(input.includeInMonthlyExpense);

  const created = await BillSubscriptionEntryModel.create({
    userId: new Types.ObjectId(params.userId),
    entryType: input.entryType,
    title: input.title,
    providerName: input.providerName,
    category: input.category,
    amount,
    cycle,
    autopayEnabled,
    paymentDueDate,
    startDate,
    endDate,
    status,
    includeInMonthlyExpense,
    lastProcessedAt: parseDateOrUndefined(input.lastProcessedAt),
    nextChargeDate: parseDateOrUndefined(input.nextChargeDate),
    notes: input.notes,
  });

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'bill-subscription',
    entityId: created._id,
    action: 'create',
    reasonTag: params.reasonTag,
    after: created.toObject(),
  });

  return created;
};

export const listBillSubscriptionEntries = async (userId: string) =>
  BillSubscriptionEntryModel.find({ userId }).sort({ createdAt: -1 });

export const updateBillSubscriptionEntry = async (params: {
  userId: string;
  entryId: string;
  input: any;
  reasonTag?: string;
}) => {
  const existing = await BillSubscriptionEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Bill/subscription entry not found');
  }

  const merged = {
    entryType: params.input.entryType ?? existing.entryType,
    title: params.input.title ?? existing.title,
    providerName: params.input.providerName ?? existing.providerName,
    category: params.input.category ?? existing.category,
    amount: params.input.amount ?? existing.amount,
    cycle: params.input.cycle ?? existing.cycle,
    autopayEnabled: params.input.autopayEnabled ?? existing.autopayEnabled,
    paymentDueDate: params.input.paymentDueDate ?? existing.paymentDueDate?.toISOString(),
    startDate: params.input.startDate ?? existing.startDate?.toISOString(),
    endDate: params.input.endDate ?? existing.endDate?.toISOString(),
    status: params.input.status ?? existing.status,
    includeInMonthlyExpense: params.input.includeInMonthlyExpense ?? existing.includeInMonthlyExpense,
    lastProcessedAt: params.input.lastProcessedAt ?? existing.lastProcessedAt?.toISOString(),
    nextChargeDate: params.input.nextChargeDate ?? existing.nextChargeDate?.toISOString(),
    notes: params.input.notes ?? existing.notes,
  };

  if (!billEntryTypes.has(merged.entryType)) {
    throw new Error('entryType is invalid');
  }
  if (typeof merged.title !== 'string' || !merged.title.trim()) {
    throw new Error('title is required');
  }
  const amount = parseNonNegativeNumber(merged.amount, 'amount', true)!;
  if (!billCycles.has(merged.cycle)) {
    throw new Error('cycle is invalid');
  }
  const nextAutopayEnabled = Boolean(merged.autopayEnabled);
  if (merged.entryType === 'subscription' && merged.cycle === 'one-time') {
    throw new Error('subscription cycle cannot be one-time');
  }
  if (merged.entryType === 'subscription' && !nextAutopayEnabled) {
    throw new Error('subscription requires autopayEnabled true');
  }
  if (merged.entryType === 'bill' && nextAutopayEnabled) {
    throw new Error('bill cannot have autopayEnabled true');
  }

  const nextPaymentDueDate = parseDateOrUndefined(merged.paymentDueDate) ?? existing.paymentDueDate;
  const nextStartDate = parseDateOrUndefined(merged.startDate);
  const nextEndDate = parseDateOrUndefined(merged.endDate);
  assertWithinLastFourYears(nextPaymentDueDate, 'paymentDueDate');
  assertWithinLastFourYears(nextStartDate, 'startDate');
  assertWithinLastFourYears(nextEndDate, 'endDate');
  if (nextStartDate && nextEndDate && nextEndDate < nextStartDate) {
    throw new Error('endDate cannot be before startDate');
  }

  if (!billStatuses.has(merged.status)) {
    throw new Error('status is invalid');
  }

  existing.entryType = merged.entryType;
  existing.title = merged.title;
  existing.providerName = merged.providerName;
  existing.category = merged.category;
  existing.amount = amount;
  existing.cycle = merged.cycle;
  existing.autopayEnabled = nextAutopayEnabled;
  existing.paymentDueDate = nextPaymentDueDate;
  existing.startDate = nextStartDate;
  existing.endDate = nextEndDate;
  existing.status = merged.status;
  existing.includeInMonthlyExpense = Boolean(merged.includeInMonthlyExpense);
  existing.lastProcessedAt = parseDateOrUndefined(merged.lastProcessedAt);
  existing.nextChargeDate = parseDateOrUndefined(merged.nextChargeDate);
  existing.notes = merged.notes;

  await existing.save();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'bill-subscription',
    entityId: existing._id,
    action: 'update',
    reasonTag: params.reasonTag,
    after: existing.toObject(),
  });

  return existing;
};

export const deleteBillSubscriptionEntry = async (params: { userId: string; entryId: string; reasonTag?: string }) => {
  const existing = await BillSubscriptionEntryModel.findOne({ _id: params.entryId, userId: params.userId });
  if (!existing) {
    throw new Error('Bill/subscription entry not found');
  }

  const before = existing.toObject();
  await existing.deleteOne();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'bill-subscription',
    entityId: before._id,
    action: 'delete',
    reasonTag: params.reasonTag,
    before,
  });

  return { deleted: true };
};

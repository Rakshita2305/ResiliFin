import { Types } from 'mongoose';

import { AuditLogModel } from '../audit/audit-log.model';
import { ExpenseCategory, ManualExpenseModel } from './expense-manual.model';
import { RecurringExpenseModel } from './expense-recurring.model';

interface CreateManualExpenseInput {
  amount: number;
  category: ExpenseCategory;
  subCategory?: string;
  date: string;
  paymentMode: 'cash' | 'upi' | 'card' | 'bank-transfer' | 'other';
  notes?: string;
}

interface CreateRecurringExpenseInput {
  name: string;
  type: string;
  frequency?: 'monthly' | 'yearly';
  amount: number;
  dueDayOfMonth: number;
  dueMonth?: number;
  isMandatory?: boolean;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
  notes?: string;
}

const allowedCategories = new Set([
  'food',
  'transport',
  'rent',
  'utilities',
  'shopping',
  'entertainment',
  'subscription',
  'healthcare',
  'education',
  'other',
]);

const allowedPaymentModes = new Set(['cash', 'upi', 'card', 'bank-transfer', 'other']);
const allowedRecurringTypes = new Set(['insurance', 'subscription', 'rent', 'premium', 'bill', 'recharge', 'other']);

const parseDateOrUndefined = (value?: string) => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid date value');
  }

  return parsed;
};

const validateInput = (input: CreateManualExpenseInput) => {
  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error('amount must be a non-negative number');
  }

  if (!allowedCategories.has(input.category)) {
    throw new Error('category is invalid');
  }

  if (!allowedPaymentModes.has(input.paymentMode)) {
    throw new Error('paymentMode is invalid');
  }

  const parsedDate = new Date(input.date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('date must be a valid ISO date string');
  }
};

export const createManualExpense = async (params: {
  userId: string;
  input: CreateManualExpenseInput;
  reasonTag?: string;
}) => {
  validateInput(params.input);

  const created = await ManualExpenseModel.create({
    userId: new Types.ObjectId(params.userId),
    amount: params.input.amount,
    category: params.input.category,
    subCategory: params.input.subCategory,
    date: new Date(params.input.date),
    paymentMode: params.input.paymentMode,
    notes: params.input.notes,
  });

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'manual_expense',
    entityId: created._id,
    action: 'create',
    reasonTag: params.reasonTag,
    after: created.toObject(),
  });

  return created;
};

export const listManualExpenses = async (params: { userId: string; limit?: number }) => {
  const safeLimit = Math.min(Math.max(params.limit ?? 50, 1), 200);

  return ManualExpenseModel.find({ userId: params.userId })
    .sort({ date: -1, createdAt: -1 })
    .limit(safeLimit);
};

export const updateManualExpense = async (params: {
  userId: string;
  expenseId: string;
  input: Partial<CreateManualExpenseInput>;
  reasonTag?: string;
}) => {
  const existing = await ManualExpenseModel.findOne({ _id: params.expenseId, userId: params.userId });
  if (!existing) {
    throw new Error('Manual expense not found');
  }

  const merged: CreateManualExpenseInput = {
    amount: params.input.amount ?? existing.amount,
    category: params.input.category ?? existing.category,
    subCategory: params.input.subCategory ?? existing.subCategory,
    date: params.input.date ?? existing.date.toISOString(),
    paymentMode: params.input.paymentMode ?? existing.paymentMode,
    notes: params.input.notes ?? existing.notes,
  };

  validateInput(merged);

  existing.amount = merged.amount;
  existing.category = merged.category;
  existing.subCategory = merged.subCategory;
  existing.date = new Date(merged.date);
  existing.paymentMode = merged.paymentMode;
  existing.notes = merged.notes;

  await existing.save();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'manual_expense',
    entityId: existing._id,
    action: 'update',
    reasonTag: params.reasonTag,
    after: existing.toObject(),
  });

  return existing;
};

export const deleteManualExpense = async (params: { userId: string; expenseId: string; reasonTag?: string }) => {
  const existing = await ManualExpenseModel.findOne({ _id: params.expenseId, userId: params.userId });
  if (!existing) {
    throw new Error('Manual expense not found');
  }

  const before = existing.toObject();
  await existing.deleteOne();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'manual_expense',
    entityId: before._id,
    action: 'delete',
    reasonTag: params.reasonTag,
    before,
  });

  return { deleted: true };
};

const validateRecurringInput = (input: CreateRecurringExpenseInput) => {
  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    throw new Error('name is required');
  }

  if (!allowedRecurringTypes.has(input.type)) {
    throw new Error('type is invalid');
  }

  if (typeof input.amount !== 'number' || !Number.isFinite(input.amount) || input.amount < 0) {
    throw new Error('amount must be a non-negative number');
  }

  const frequency = input.frequency ?? 'monthly';
  if (!['monthly', 'yearly'].includes(frequency)) {
    throw new Error('frequency must be monthly or yearly');
  }

  if (
    typeof input.dueDayOfMonth !== 'number' ||
    !Number.isInteger(input.dueDayOfMonth) ||
    input.dueDayOfMonth < 1 ||
    input.dueDayOfMonth > 31
  ) {
    throw new Error('dueDayOfMonth must be an integer between 1 and 31');
  }

  if (frequency === 'yearly') {
    if (
      typeof input.dueMonth !== 'number' ||
      !Number.isInteger(input.dueMonth) ||
      input.dueMonth < 1 ||
      input.dueMonth > 12
    ) {
      throw new Error('dueMonth must be an integer between 1 and 12 for yearly expenses');
    }
  }

  if (input.isMandatory !== undefined && typeof input.isMandatory !== 'boolean') {
    throw new Error('isMandatory must be a boolean');
  }

  if (input.isActive !== undefined && typeof input.isActive !== 'boolean') {
    throw new Error('isActive must be a boolean');
  }

  parseDateOrUndefined(input.startDate);
  parseDateOrUndefined(input.endDate);
};

export const createRecurringExpense = async (params: {
  userId: string;
  input: CreateRecurringExpenseInput;
  reasonTag?: string;
}) => {
  validateRecurringInput(params.input);

  const created = await RecurringExpenseModel.create({
    userId: new Types.ObjectId(params.userId),
    name: params.input.name.trim(),
    type: params.input.type,
    frequency: params.input.frequency ?? 'monthly',
    amount: params.input.amount,
    dueDayOfMonth: params.input.dueDayOfMonth,
    dueMonth: params.input.frequency === 'yearly' ? params.input.dueMonth : undefined,
    isMandatory: params.input.isMandatory ?? false,
    isActive: params.input.isActive ?? true,
    startDate: parseDateOrUndefined(params.input.startDate),
    endDate: parseDateOrUndefined(params.input.endDate),
    notes: params.input.notes,
  });

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'recurring_expense',
    entityId: created._id,
    action: 'create',
    reasonTag: params.reasonTag,
    after: created.toObject(),
  });

  return created;
};

export const listRecurringExpenses = async (params: { userId: string; limit?: number }) => {
  const safeLimit = Math.min(Math.max(params.limit ?? 50, 1), 200);

  return RecurringExpenseModel.find({ userId: params.userId })
    .sort({ isActive: -1, createdAt: -1 })
    .limit(safeLimit);
};

export const updateRecurringExpense = async (params: {
  userId: string;
  expenseId: string;
  input: Partial<CreateRecurringExpenseInput>;
  reasonTag?: string;
}) => {
  const existing = await RecurringExpenseModel.findOne({ _id: params.expenseId, userId: params.userId });
  if (!existing) {
    throw new Error('Recurring expense not found');
  }

  const merged: CreateRecurringExpenseInput = {
    name: params.input.name ?? existing.name,
    type: params.input.type ?? existing.type,
    frequency: params.input.frequency ?? existing.frequency,
    amount: params.input.amount ?? existing.amount,
    dueDayOfMonth: params.input.dueDayOfMonth ?? existing.dueDayOfMonth,
    dueMonth: params.input.dueMonth ?? existing.dueMonth,
    isMandatory: params.input.isMandatory ?? existing.isMandatory,
    isActive: params.input.isActive ?? existing.isActive,
    startDate: params.input.startDate ?? existing.startDate?.toISOString(),
    endDate: params.input.endDate ?? existing.endDate?.toISOString(),
    notes: params.input.notes ?? existing.notes,
  };

  validateRecurringInput(merged);

  existing.name = merged.name.trim();
  existing.type = merged.type as typeof existing.type;
  existing.frequency = (merged.frequency ?? 'monthly') as typeof existing.frequency;
  existing.amount = merged.amount;
  existing.dueDayOfMonth = merged.dueDayOfMonth;
  existing.dueMonth = existing.frequency === 'yearly' ? merged.dueMonth : undefined;
  existing.isMandatory = merged.isMandatory ?? false;
  existing.isActive = merged.isActive ?? true;
  existing.startDate = parseDateOrUndefined(merged.startDate);
  existing.endDate = parseDateOrUndefined(merged.endDate);
  existing.notes = merged.notes;

  await existing.save();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'recurring_expense',
    entityId: existing._id,
    action: 'update',
    reasonTag: params.reasonTag,
    after: existing.toObject(),
  });

  return existing;
};

export const deleteRecurringExpense = async (params: { userId: string; expenseId: string; reasonTag?: string }) => {
  const existing = await RecurringExpenseModel.findOne({ _id: params.expenseId, userId: params.userId });
  if (!existing) {
    throw new Error('Recurring expense not found');
  }

  const before = existing.toObject();
  await existing.deleteOne();

  await AuditLogModel.create({
    userId: new Types.ObjectId(params.userId),
    entityType: 'recurring_expense',
    entityId: before._id,
    action: 'delete',
    reasonTag: params.reasonTag,
    before,
  });

  return { deleted: true };
};

import { Types } from 'mongoose';

import { AuditLogModel } from '../audit/audit-log.model';
import { LoanModel, LoanType } from './loan.model';

interface CreateLoanInput {
  loanType: LoanType;
  lenderName: string;
  principalAmount: number;
  outstandingAmount: number;
  emiAmount: number;
  interestRate?: number;
  startDate: string;
  dueDayOfMonth: number;
  tenureMonths?: number;
  isAutoPay?: boolean;
}

const allowedLoanTypes = new Set(['home', 'car', 'personal', 'education', 'credit-card', 'other']);

const validateInput = (input: CreateLoanInput) => {
  if (!allowedLoanTypes.has(input.loanType)) {
    throw new Error('loanType is invalid');
  }

  if (typeof input.lenderName !== 'string' || input.lenderName.trim().length === 0) {
    throw new Error('lenderName is required');
  }

  const numberChecks: Array<{ field: keyof CreateLoanInput; min?: number; max?: number }> = [
    { field: 'principalAmount', min: 0 },
    { field: 'outstandingAmount', min: 0 },
    { field: 'emiAmount', min: 0 },
    { field: 'interestRate', min: 0, max: 100 },
    { field: 'dueDayOfMonth', min: 1, max: 31 },
    { field: 'tenureMonths', min: 1 },
  ];

  numberChecks.forEach(({ field, min, max }) => {
    const value = input[field] as number | undefined;
    if (value === undefined) {
      return;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new Error(`${field} must be a valid number`);
    }
    if (min !== undefined && value < min) {
      throw new Error(`${field} must be >= ${min}`);
    }
    if (max !== undefined && value > max) {
      throw new Error(`${field} must be <= ${max}`);
    }
  });

  const parsedDate = new Date(input.startDate);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('startDate must be a valid ISO date string');
  }
};

export const createLoan = async (params: { userId: string; input: CreateLoanInput; reasonTag?: string }) => {
  validateInput(params.input);

  const created = await LoanModel.create({
    userId: new Types.ObjectId(params.userId),
    loanType: params.input.loanType,
    lenderName: params.input.lenderName,
    principalAmount: params.input.principalAmount,
    outstandingAmount: params.input.outstandingAmount,
    emiAmount: params.input.emiAmount,
    interestRate: params.input.interestRate,
    startDate: new Date(params.input.startDate),
    dueDayOfMonth: params.input.dueDayOfMonth,
    tenureMonths: params.input.tenureMonths,
    isAutoPay: params.input.isAutoPay ?? false,
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

export const listLoans = async (params: { userId: string; limit?: number }) => {
  const safeLimit = Math.min(Math.max(params.limit ?? 50, 1), 200);

  return LoanModel.find({ userId: params.userId })
    .sort({ createdAt: -1 })
    .limit(safeLimit);
};

export const updateLoan = async (params: {
  userId: string;
  loanId: string;
  input: Partial<CreateLoanInput>;
  reasonTag?: string;
}) => {
  const disallowedKeys = ['loanType', 'lenderName', 'principalAmount', 'startDate'];
  const forbidden = disallowedKeys.find((key) => Object.prototype.hasOwnProperty.call(params.input, key));

  if (forbidden) {
    throw new Error(`${forbidden} cannot be changed after loan creation`);
  }

  const existing = await LoanModel.findOne({ _id: params.loanId, userId: params.userId });

  if (!existing) {
    throw new Error('Loan not found');
  }

  const merged: CreateLoanInput = {
    loanType: (params.input.loanType as LoanType | undefined) ?? existing.loanType,
    lenderName: (params.input.lenderName as string) ?? existing.lenderName,
    principalAmount: (params.input.principalAmount as number) ?? existing.principalAmount,
    outstandingAmount: (params.input.outstandingAmount as number) ?? existing.outstandingAmount,
    emiAmount: (params.input.emiAmount as number) ?? existing.emiAmount,
    interestRate: (params.input.interestRate as number | undefined) ?? existing.interestRate,
    startDate:
      (params.input.startDate as string | undefined) ??
      existing.startDate.toISOString(),
    dueDayOfMonth: (params.input.dueDayOfMonth as number) ?? existing.dueDayOfMonth,
    tenureMonths: (params.input.tenureMonths as number | undefined) ?? existing.tenureMonths,
    isAutoPay: (params.input.isAutoPay as boolean | undefined) ?? existing.isAutoPay,
  };

  validateInput(merged);

  existing.loanType = merged.loanType;
  existing.lenderName = merged.lenderName;
  existing.principalAmount = merged.principalAmount;
  existing.outstandingAmount = merged.outstandingAmount;
  existing.emiAmount = merged.emiAmount;
  existing.interestRate = merged.interestRate;
  existing.startDate = new Date(merged.startDate);
  existing.dueDayOfMonth = merged.dueDayOfMonth;
  existing.tenureMonths = merged.tenureMonths;
  existing.isAutoPay = merged.isAutoPay ?? false;

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

export const deleteLoan = async (params: { userId: string; loanId: string; reasonTag?: string }) => {
  const existing = await LoanModel.findOne({ _id: params.loanId, userId: params.userId });

  if (!existing) {
    throw new Error('Loan not found');
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

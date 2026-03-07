export const PROFILE_REQUIRED_FIELDS = [
  'monthlySalaryApprox',
  'monthlyFixedExpense',
  'variableExpenseBaseline',
] as const;

export type ProfileRequiredField = (typeof PROFILE_REQUIRED_FIELDS)[number];

export interface ProfileCompletionStatus {
  complete: boolean;
  missingFields: ProfileRequiredField[];
}

export interface UpsertProfileInput {
  fullName?: string;
  age?: number;
  occupation?: string;
  location?: string;
  familySize?: number;
  preferredBanks?: string[];
  monthlySalaryApprox?: number;
  monthlyFixedExpense?: number;
  variableExpenseBaseline?: number;
  liquidSavings?: number;
  emergencyFund?: number;
  extendedSavingsTotal?: number;
  monthlyExpenseInputMode?: 'approx' | 'statement' | 'hybrid';
  statementUploadRecommended?: boolean;
  paymentSchedules?: Array<{
    kind: 'emi' | 'bill' | 'recharge' | 'investment' | 'insurance';
    dueDayOfMonth: number;
    amount?: number;
    autoPay?: boolean;
  }>;
  currency?: 'INR';
}

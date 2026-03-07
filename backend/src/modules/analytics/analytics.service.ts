import { ManualExpenseModel } from '../expenses/expense-manual.model';
import { RecurringExpenseModel } from '../expenses/expense-recurring.model';
import { InsuranceEntryModel } from '../finance/insurance.model';
import { InvestmentEntryModel } from '../finance/investment.model';
import { SavingsEntryModel } from '../finance/savings.model';
import { LoanModel } from '../liabilities/loan.model';
import { getProfileByUserId } from '../profiles/profile.service';
import { AnalyticsSummary, EmiBurdenStatus, EmergencyStatus, RiskCategory } from './analytics.types';

const round2 = (value: number) => Math.round(value * 100) / 100;

const riskCategoryFromScore = (score: number): RiskCategory => {
  if (score <= 30) {
    return 'low';
  }
  if (score <= 70) {
    return 'medium';
  }
  return 'high';
};

const emiStatusFromRatio = (ratio: number): EmiBurdenStatus => {
  if (ratio < 0.3) {
    return 'healthy';
  }
  if (ratio <= 0.5) {
    return 'moderate';
  }
  return 'burdened';
};

const emergencyStatusFromCoverage = (coverageRatio: number): EmergencyStatus => {
  if (coverageRatio >= 1) {
    return 'good';
  }
  if (coverageRatio >= 0.5) {
    return 'moderate';
  }
  return 'low';
};

export const getAnalyticsSummary = async (userId: string): Promise<AnalyticsSummary> => {
  const profile = await getProfileByUserId(userId);

  const missingData: string[] = [];
  if (!profile?.monthlySalaryApprox || profile.monthlySalaryApprox <= 0) {
    missingData.push('monthlySalaryApprox');
  }
  if (profile?.monthlyFixedExpense === undefined) {
    missingData.push('monthlyFixedExpense');
  }
  if (profile?.variableExpenseBaseline === undefined) {
    missingData.push('variableExpenseBaseline');
  }
  if (profile?.liquidSavings === undefined) {
    missingData.push('liquidSavings');
  }
  if (profile?.emergencyFund === undefined) {
    missingData.push('emergencyFund');
  }
  if (profile?.monthlyExpenseInputMode === undefined) {
    missingData.push('monthlyExpenseInputMode');
  }

  const income = profile?.monthlySalaryApprox ?? 0;
  const fixedExpense = profile?.monthlyFixedExpense ?? 0;
  const variableBaseline = profile?.variableExpenseBaseline ?? 0;
  const liquidSavings = profile?.liquidSavings ?? 0;
  const emergencyFund = profile?.emergencyFund ?? 0;
  const extendedSavingsTotal = profile?.extendedSavingsTotal ?? 0;

  const [loans, recurringMandatory, manualExpensesLast90, savingsEntries, investmentEntries, insuranceEntries] = await Promise.all([
    LoanModel.find({ userId }),
    RecurringExpenseModel.find({ userId, isMandatory: true, isActive: true }),
    ManualExpenseModel.find({
      userId,
      date: { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
    }),
    SavingsEntryModel.find({ userId }),
    InvestmentEntryModel.find({ userId }),
    InsuranceEntryModel.find({ userId }),
  ]);

  const totalEmi = loans.reduce((sum, loan) => sum + (loan.emiAmount ?? 0), 0);
  const recurringTotal = recurringMandatory.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const manualTotal90 = manualExpensesLast90.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const avgManualMonthly = manualTotal90 / 3;

  const insuranceMonthlyPremium = insuranceEntries.reduce((sum, item) => {
    const premium = item.premiumAmount ?? 0;
    if (!premium) {
      return sum;
    }
    if (item.premiumFrequency === 'yearly') {
      return sum + premium / 12;
    }
    if (item.premiumFrequency === 'quarterly') {
      return sum + premium / 3;
    }
    return sum + premium;
  }, 0);

  const monthlyEssentialOutflow =
    fixedExpense + variableBaseline + totalEmi + recurringTotal + avgManualMonthly + insuranceMonthlyPremium;

  const totalLiquidFunds = liquidSavings + emergencyFund;
  const totalExtendedFunds = totalLiquidFunds + extendedSavingsTotal;

  const liquidSurvivalMonths = monthlyEssentialOutflow > 0 ? totalLiquidFunds / monthlyEssentialOutflow : 0;
  const extendedSurvivalMonths = monthlyEssentialOutflow > 0 ? totalExtendedFunds / monthlyEssentialOutflow : 0;

  const emiBurdenRatio = income > 0 ? totalEmi / income : totalEmi > 0 ? 1 : 0;
  const expensePressureRatio = income > 0 ? monthlyEssentialOutflow / income : monthlyEssentialOutflow > 0 ? 1 : 0;

  const emergencyFundTarget = monthlyEssentialOutflow * 6;
  const emergencyCoverageRatio = emergencyFundTarget > 0 ? emergencyFund / emergencyFundTarget : 0;

  const savingsRisk = liquidSurvivalMonths >= 6 ? 2 : liquidSurvivalMonths >= 4 ? 10 : liquidSurvivalMonths >= 2 ? 22 : 35;
  const emiRisk = emiBurdenRatio < 0.3 ? 5 : emiBurdenRatio <= 0.5 ? 18 : 30;
  const expenseRisk = expensePressureRatio <= 0.7 ? 5 : expensePressureRatio <= 1 ? 12 : 20;
  const emergencyRisk = emergencyCoverageRatio >= 1 ? 2 : emergencyCoverageRatio >= 0.5 ? 8 : 15;

  const fragilityScore = Math.min(100, Math.round(savingsRisk + emiRisk + expenseRisk + emergencyRisk));
  const riskCategory = riskCategoryFromScore(fragilityScore);
  const emiBurdenStatus = emiStatusFromRatio(emiBurdenRatio);
  const emergencyStatus = emergencyStatusFromCoverage(emergencyCoverageRatio);

  const totalSavings = savingsEntries.reduce((sum, item) => sum + (item.amount ?? 0), 0);
  const totalInvestments = investmentEntries.reduce(
    (sum, item) => sum + (item.currentValue ?? item.investedAmount ?? 0),
    0,
  );
  const totalInsuranceCoverage = insuranceEntries.reduce((sum, item) => sum + (item.coverageAmount ?? 0), 0);
  const totalInsurancePremium = insuranceEntries.reduce((sum, item) => sum + (item.premiumAmount ?? 0), 0);
  const moneyRemaining = income - monthlyEssentialOutflow;

  const alerts: string[] = [];
  if (liquidSurvivalMonths < 3) {
    alerts.push('Liquid savings cover less than 3 months of essential outflow.');
  }
  if (emiBurdenRatio > 0.5) {
    alerts.push('EMI burden is above 50% of monthly income.');
  }
  if (emergencyCoverageRatio < 0.5) {
    alerts.push('Emergency fund is below 50% of recommended target.');
  }

  if (moneyRemaining < 0) {
    alerts.push('Monthly outflow exceeds salary. Reduce expenses or increase income.');
  }

  const improvementInsights: string[] = [];
  if (expensePressureRatio > 1) {
    improvementInsights.push('Track manual + variable expenses weekly and cut non-essential spending by 10-15%.');
  }
  if (emiBurdenRatio > 0.5) {
    improvementInsights.push('EMI burden is high. Consider refinancing or prepaying high-interest loans.');
  }
  if (emergencyCoverageRatio < 1) {
    improvementInsights.push('Build emergency fund towards 6 months of essential outflow.');
  }
  if (profile?.monthlyExpenseInputMode === 'approx') {
    improvementInsights.push('Switch to statement-based tracking for more accurate monthly expense analytics.');
  }

  return {
    fragilityScore,
    riskCategory,
    liquidSurvivalMonths: round2(liquidSurvivalMonths),
    extendedSurvivalMonths: round2(extendedSurvivalMonths),
    monthlyIncome: round2(income),
    monthlyEssentialOutflow: round2(monthlyEssentialOutflow),
    totalEmi: round2(totalEmi),
    emiBurdenRatio: round2(emiBurdenRatio),
    emiBurdenStatus,
    emergencyFundTarget: round2(emergencyFundTarget),
    emergencyStatus,
    totalSavings: round2(totalSavings),
    totalInvestments: round2(totalInvestments),
    totalInsuranceCoverage: round2(totalInsuranceCoverage),
    totalInsurancePremium: round2(totalInsurancePremium),
    moneyRemaining: round2(moneyRemaining),
    improvementInsights,
    alerts,
    missingData,
  };
};

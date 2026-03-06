export type RiskCategory = 'low' | 'medium' | 'high';
export type EmiBurdenStatus = 'healthy' | 'moderate' | 'burdened';
export type EmergencyStatus = 'low' | 'moderate' | 'good';

export interface AnalyticsSummary {
  fragilityScore: number;
  riskCategory: RiskCategory;
  liquidSurvivalMonths: number;
  extendedSurvivalMonths: number;
  monthlyIncome: number;
  monthlyEssentialOutflow: number;
  totalEmi: number;
  emiBurdenRatio: number;
  emiBurdenStatus: EmiBurdenStatus;
  emergencyFundTarget: number;
  emergencyStatus: EmergencyStatus;
  totalSavings: number;
  totalInvestments: number;
  totalInsuranceCoverage: number;
  totalInsurancePremium: number;
  moneyRemaining: number;
  improvementInsights: string[];
  alerts: string[];
  missingData: string[];
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, TrendingUp, TrendingDown, PiggyBank, DollarSign } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

function CircularGauge({ score }: { score: number }) {
  const data = [
    { value: score },
    { value: 100 - score },
  ];

  const getColor = () => {
    if (score >= 70) return '#10b981'; // Green
    if (score >= 40) return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  const getRiskLabel = () => {
    if (score >= 70) return { label: 'Stable', color: 'bg-green-100 text-green-700' };
    if (score >= 40) return { label: 'Warning', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Critical', color: 'bg-red-100 text-red-700' };
  };

  const risk = getRiskLabel();

  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={90}
            paddingAngle={0}
            dataKey="value"
          >
            <Cell fill={getColor()} />
            <Cell fill="#f1f5f9" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex items-center justify-center flex-col pt-8">
        <div className="text-4xl font-semibold text-gray-900">{score}</div>
        <div className="text-sm text-gray-500">Fragility Score</div>
        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${risk.color}`}>
          {risk.label}
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    income: 0,
    expenses: 0,
    emis: 0,
    savings: 0,
    investments: 0,
    emergencyFund: 0,
  });

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('http://localhost:4000/api/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          if (res.status === 401) {
            localStorage.removeItem('authToken');
            navigate('/');
            return;
          }
          setError('Failed to load financial profile');
          return;
        }

        const data = await res.json();

        const basic = data.basicFinance || {};
        const income = Number(basic.monthlySalary || 0);
        const variableExpenses = Number(basic.variableExpenses || 0);

        const bills = Array.isArray(data.bills) ? data.bills : [];
        const billsTotal = bills.reduce(
          (sum: number, b: any) => sum + Number(b.amount || 0),
          0,
        );

        const insurances = Array.isArray(data.insurances) ? data.insurances : [];
        const insuranceTotal = insurances.reduce(
          (sum: number, ins: any) => sum + Number(ins.premiumAmount || 0),
          0,
        );

        const expenses = variableExpenses + billsTotal + insuranceTotal;

        const liquidSavings = Number(data.liquidSavings || 0);
        const ns = data.normalSavings || {};
        const emergencyFunds = Number(ns.emergencyFunds || 0);
        const fds = Number(ns.fds || 0);
        const rds = Number(ns.rds || 0);
        const savings = liquidSavings + emergencyFunds + fds + rds;

        const investmentsArr = Array.isArray(data.investments) ? data.investments : [];
        const investments = investmentsArr.reduce(
          (sum: number, inv: any) => sum + Number(inv.amount || 0),
          0,
        );

        const loans = Array.isArray(data.loans) ? data.loans : [];
        const emis = loans.reduce((sum: number, l: any) => {
          const principal = Number(l.principalAmount || 0);
          const rate = Number(l.interestRate || 0);
          if (!principal || !rate) return sum;
          const months = 120;
          const r = rate / 12 / 100;
          const emi =
            (principal * r * Math.pow(1 + r, months)) /
            (Math.pow(1 + r, months) - 1);
          return sum + (Number.isFinite(emi) ? emi : 0);
        }, 0);

        setMetrics({
          income,
          expenses,
          emis,
          savings,
          investments,
          emergencyFund: emergencyFunds,
        });
      } catch (err) {
        console.error(err);
        setError('Unable to load financial profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const income = metrics.income;
  const expenses = metrics.expenses;
  const emis = metrics.emis;
  const savings = metrics.savings;
  const investments = metrics.investments;
  const emergencyFund = metrics.emergencyFund;

  const monthlySurplus = income - expenses - emis;
  const emiPercentage =
    income > 0 ? ((emis / income) * 100).toFixed(1) : '0.0';
  const savingsRate =
    income > 0 ? ((monthlySurplus / income) * 100).toFixed(1) : '0.0';
  const totalAssets = savings + investments + emergencyFund;
  const totalLiabilities = emis * 12; // Rough estimate
  const survivalMonths =
    expenses + emis > 0
      ? Math.floor((savings + emergencyFund) / (expenses + emis))
      : 0;
  
  // Calculate fragility score (0-100, higher is better)
  const fragilityScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        (survivalMonths * 10) +
        (100 - parseFloat(emiPercentage)) * 0.3 +
        parseFloat(savingsRate) * 0.5
      )
    )
  );

  const assetsVsLiabilities = [
    { name: 'Assets', value: totalAssets, color: '#10b981' },
    { name: 'Liabilities', value: totalLiabilities, color: '#ef4444' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30 pb-24">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Financial Health</h1>
          <p className="text-sm text-gray-600">Your complete financial overview</p>
        </div>

        {loading && (
          <p className="text-sm text-blue-600 mb-4">Loading your financial profile...</p>
        )}
        {error && !loading && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {/* Empty state for new users */}
        {!loading && !error && income === 0 && savings === 0 && emis === 0 && (
          <div className="bg-white rounded-2xl shadow-md shadow-blue-100/50 p-6 border border-gray-100 mb-6 text-center">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <PiggyBank className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No financial data yet</h2>
            <p className="text-sm text-gray-500 mb-4">Complete your profile to see your financial health and insights.</p>
            <button
              onClick={() => navigate('/setup')}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-medium"
            >
              Complete Profile
            </button>
          </div>
        )}

        {/* Hero Card - Fragility Score (hide when empty) */}
        {!(income === 0 && savings === 0 && emis === 0) && (
        <div className="bg-white rounded-2xl shadow-lg shadow-blue-100/50 p-6 border border-gray-100 mb-4">
          <CircularGauge score={fragilityScore} />
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-2xl font-semibold text-gray-900">{survivalMonths}</div>
                <div className="text-xs text-gray-500">Survival Months</div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Key Metrics - hide when empty */}
        {!(income === 0 && savings === 0 && emis === 0) && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-xl shadow-md shadow-blue-100/50 p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Monthly Surplus</span>
              {monthlySurplus >= 0 ? (
                <TrendingUp className="w-4 h-4 text-green-500" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className={`text-xl font-semibold ${monthlySurplus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{Math.abs(monthlySurplus).toLocaleString()}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {monthlySurplus >= 0 ? 'Surplus' : 'Deficit'}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md shadow-blue-100/50 p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">EMI % of Income</span>
              <DollarSign className="w-4 h-4 text-blue-500" />
            </div>
            <div className={`text-xl font-semibold ${parseFloat(emiPercentage) > 50 ? 'text-red-600' : 'text-gray-900'}`}>
              {emiPercentage}%
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {parseFloat(emiPercentage) > 50 ? 'High risk' : 'Manageable'}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md shadow-blue-100/50 p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Savings Rate</span>
              <PiggyBank className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-xl font-semibold text-gray-900">
              {savingsRate}%
            </div>
            <div className="text-xs text-gray-500 mt-1">Of income</div>
          </div>

          <div className="bg-white rounded-xl shadow-md shadow-blue-100/50 p-4 border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Assets vs Debt</span>
              <TrendingUp className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-semibold text-gray-900">
              {totalLiabilities > 0 ? (totalAssets / totalLiabilities).toFixed(1) : '—'}x
            </div>
            <div className="text-xs text-gray-500 mt-1">Coverage ratio</div>
          </div>
        </div>
        )}

        {/* Assets vs Liabilities Chart - hide when empty */}
        {!(income === 0 && savings === 0 && emis === 0) && (
        <div className="bg-white rounded-2xl shadow-md shadow-blue-100/50 p-6 border border-gray-100 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-4">Assets vs Liabilities</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie
                  data={assetsVsLiabilities}
                  cx="50%"
                  cy="50%"
                  innerRadius={30}
                  outerRadius={50}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assetsVsLiabilities.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="text-xs text-gray-600">Assets: ₹{(totalAssets / 100000).toFixed(1)}L</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-xs text-gray-600">Debt: ₹{(totalLiabilities / 100000).toFixed(1)}L</span>
            </div>
          </div>
        </div>
        )}

        {/* Alerts Section - hide when empty */}
        {!(income === 0 && savings === 0 && emis === 0) && (
        <div className="space-y-3">
          {emergencyFund < expenses * 3 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-yellow-900 text-sm">Low Emergency Fund</div>
                <div className="text-xs text-yellow-700 mt-1">
                  Your emergency fund should cover at least 3-6 months of expenses.
                </div>
              </div>
            </div>
          )}
          
          {parseFloat(emiPercentage) > 50 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-red-900 text-sm">High EMI Burden</div>
                <div className="text-xs text-red-700 mt-1">
                  Your EMI is {emiPercentage}% of income. Consider reducing debt.
                </div>
              </div>
            </div>
          )}

          {parseFloat(savingsRate) < 10 && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-medium text-orange-900 text-sm">Low Savings Rate</div>
                <div className="text-xs text-orange-700 mt-1">
                  Try to save at least 20% of your monthly income.
                </div>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

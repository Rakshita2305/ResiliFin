import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Calendar, CreditCard, TrendingDown, AlertCircle } from 'lucide-react';
import { BottomNav } from '../components/BottomNav';

export default function Expenses() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [emis, setEmis] = useState<
    { name: string; amount: number; dueDate: string; remainingTenure: string; progress: number }[]
  >([]);
  const [recurringExpenses, setRecurringExpenses] = useState<
    { name: string; amount: number; icon: string }[]
  >([]);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
      return;
    }

    const iconForBill = (name: string): string => {
      const lower = name.toLowerCase();
      if (lower.includes('rent')) return '🏠';
      if (lower.includes('netflix')) return '📺';
      if (lower.includes('prime')) return '📦';
      if (lower.includes('spotify') || lower.includes('music')) return '🎵';
      if (lower.includes('life insurance')) return '🛡️';
      if (lower.includes('health')) return '💊';
      if (lower.includes('tv') || lower.includes('dth')) return '📺';
      if (lower.includes('internet') || lower.includes('wifi')) return '📶';
      return '💸';
    };

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
          setError('Failed to load expenses');
          return;
        }
        const data = await res.json();

        const loans = Array.isArray(data.loans) ? data.loans : [];
        const emisMapped = loans.map((l: any) => {
          const principal = Number(l.principalAmount || 0);
          const rate = Number(l.interestRate || 0);
          const months = 120;
          const r = rate / 12 / 100;
          const emi =
            principal && rate
              ? (principal * r * Math.pow(1 + r, months)) /
                (Math.pow(1 + r, months) - 1)
              : 0;
          return {
            name: l.loanType || 'Loan',
            amount: Math.round(Number.isFinite(emi) ? emi : 0),
            dueDate: l.monthlyDueDate ? `${l.monthlyDueDate}th` : '-',
            remainingTenure: l.endDate ? 'ongoing' : `${months} months`,
            progress: 50,
          };
        });
        setEmis(emisMapped);

        const bills = Array.isArray(data.bills) ? data.bills : [];
        const insurances = Array.isArray(data.insurances) ? data.insurances : [];

        const recurring: { name: string; amount: number; icon: string }[] = [];

        bills.forEach((b: any) => {
          recurring.push({
            name: b.billType || 'Bill',
            amount: Number(b.amount || 0),
            icon: iconForBill(b.billType || ''),
          });
        });

        insurances.forEach((ins: any) => {
          recurring.push({
            name: ins.insuranceType || 'Insurance',
            amount: Number(ins.premiumAmount || 0),
            icon: '🛡️',
          });
        });

        setRecurringExpenses(recurring);
      } catch (err) {
        console.error(err);
        setError('Unable to load expenses');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const totalEMI = emis.reduce((sum, emi) => sum + emi.amount, 0);
  const totalRecurring = recurringExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30 pb-24">
      <div className="max-w-md mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Expense Tracker</h1>
          <p className="text-sm text-gray-600">Monitor your EMIs and recurring expenses</p>
        </div>

        {loading && (
          <p className="text-sm text-blue-600 mb-4">Loading your expenses...</p>
        )}
        {error && !loading && (
          <p className="text-sm text-red-600 mb-4">{error}</p>
        )}

        {/* EMI Tracker Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">EMI Tracker</h2>
            <div className="text-sm text-gray-600">Total: ₹{totalEMI.toLocaleString()}/mo</div>
          </div>

          <div className="space-y-3">
            {emis.map((emi, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-md shadow-blue-100/50 p-4 border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{emi.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">Due on {emi.dueDate} of every month</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">₹{emi.amount.toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${emi.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">{emi.progress}%</div>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{emi.remainingTenure} left</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recurring Expenses Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recurring Expenses</h2>
            <div className="text-sm text-gray-600">Total: ₹{totalRecurring.toLocaleString()}/mo</div>
          </div>

          <div className="bg-white rounded-xl shadow-md shadow-blue-100/50 border border-gray-100 divide-y divide-gray-100">
            {recurringExpenses.map((expense, index) => (
              <div key={index} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-xl">
                    {expense.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{expense.name}</div>
                    <div className="text-xs text-gray-500">Monthly subscription</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">₹{expense.amount.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Alert */}
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium text-orange-900 text-sm">Savings Decline Detected</div>
            <p className="text-xs text-orange-700 mt-1">
              Your savings rate has decreased by 8% this month compared to last month. Review your expenses to identify areas for optimization.
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 p-6 text-white">
          <h3 className="text-sm font-medium mb-4 opacity-90">Monthly Obligations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-xs opacity-80">Total EMIs</span>
              </div>
              <div className="text-2xl font-semibold">₹{totalEMI.toLocaleString()}</div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-xs opacity-80">Recurring</span>
              </div>
              <div className="text-2xl font-semibold">₹{totalRecurring.toLocaleString()}</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="text-xs opacity-80 mb-1">Total Monthly Outflow</div>
            <div className="text-3xl font-semibold">₹{(totalEMI + totalRecurring).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

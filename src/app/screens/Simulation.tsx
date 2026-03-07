import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  Briefcase,
  TrendingDown,
  Stethoscope,
  Flame,
  CreditCard,
  Zap,
  Sliders,
  ChevronRight,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  CalendarDays,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BottomNav } from '../components/BottomNav';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScenarioId =
  | 'job-loss'
  | 'salary-reduction'
  | 'medical-emergency'
  | 'expense-inflation'
  | 'loan-burden'
  | 'compound-shock'
  | 'custom-event';

interface Scenario {
  id: ScenarioId;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}

// ─── Scenario definitions ─────────────────────────────────────────────────────

const SCENARIOS: Scenario[] = [
  {
    id: 'job-loss',
    icon: <Briefcase className="w-5 h-5" />,
    title: 'Job Loss',
    description: 'Income drops to zero while expenses remain constant.',
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
  },
  {
    id: 'salary-reduction',
    icon: <TrendingDown className="w-5 h-5" />,
    title: 'Salary Reduction',
    description: 'Partial income cut — see recalculated cash flow.',
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    id: 'medical-emergency',
    icon: <Stethoscope className="w-5 h-5" />,
    title: 'Medical Emergency',
    description: 'Sudden one-time medical expense hits your savings.',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  {
    id: 'expense-inflation',
    icon: <Flame className="w-5 h-5" />,
    title: 'Expense Inflation',
    description: 'All monthly expenses rise by a fixed percentage.',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    id: 'loan-burden',
    icon: <CreditCard className="w-5 h-5" />,
    title: 'Loan Burden',
    description: 'Add a new EMI and see the impact on financial health.',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    id: 'compound-shock',
    icon: <Zap className="w-5 h-5" />,
    title: 'Compound Shock',
    description: 'Combine multiple adverse events simultaneously.',
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    border: 'border-pink-200',
  },
  {
    id: 'custom-event',
    icon: <Sliders className="w-5 h-5" />,
    title: 'Custom Event',
    description: 'Define your own scenario with a custom financial impact.',
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRisk(survivalMonths: number): { label: string; color: string; bg: string; icon: React.ReactNode } {
  if (survivalMonths >= 12)
    return { label: 'Stable', color: 'text-green-700', bg: 'bg-green-100', icon: <CheckCircle2 className="w-4 h-4 text-green-600" /> };
  if (survivalMonths >= 6)
    return { label: 'Moderate Risk', color: 'text-amber-700', bg: 'bg-amber-100', icon: <AlertTriangle className="w-4 h-4 text-amber-600" /> };
  return { label: 'High Risk', color: 'text-red-700', bg: 'bg-red-100', icon: <XCircle className="w-4 h-4 text-red-600" /> };
}

function fmt(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

// ─── Slider component ─────────────────────────────────────────────────────────

function SliderField({
  label, min, max, step = 1, value, onChange, displayValue,
}: {
  label: string; min: number; max: number; step?: number;
  value: number; onChange: (v: number) => void; displayValue: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm text-gray-700">{label}</label>
        <span className="text-sm font-semibold text-blue-600">{displayValue}</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer accent-blue-500"
        style={{ background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)` }}
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1">
        <span>{min}</span><span>{max}</span>
      </div>
    </div>
  );
}

function NumberInput({
  label, value, onChange, placeholder, prefix = '₹',
}: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; prefix?: string;
}) {
  return (
    <div>
      <label className="text-sm text-gray-700 mb-1.5 block">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{prefix}</span>
        <input
          type="number" value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 pl-7 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
      </div>
    </div>
  );
}

// ─── Custom Tooltip for charts ────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">Month {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Simulation() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);

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
        setProfile(data);
      } catch (err) {
        console.error(err);
        setError('Unable to load financial profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [navigate]);

  const baseIncome = parseFloat(profile?.basicFinance?.monthlySalary ?? '') || 75000;
  const baseExpenses = parseFloat(profile?.basicFinance?.variableExpenses ?? '') || 20000;
  const baseSavings =
    parseFloat(profile?.liquidSavings ?? '') ||
    parseFloat(profile?.normalSavings?.emergencyFunds ?? '') ||
    150000;
  const baseEmis =
    Array.isArray(profile?.loans)
      ? profile.loans.reduce((sum: number, l: any) => {
          const principal = parseFloat(l.principalAmount ?? '') || 0;
          const rate = parseFloat(l.interestRate ?? '') || 8;
          const months = 120;
          const r = rate / 12 / 100;
          const emi =
            (principal * r * Math.pow(1 + r, months)) /
            (Math.pow(1 + r, months) - 1);
          return sum + (Number.isFinite(emi) ? emi : 0);
        }, 0)
      : 24000;

  // UI state
  const [selectedId, setSelectedId] = useState<ScenarioId | null>(null);
  const [simulated, setSimulated] = useState(false);
  const [horizon, setHorizon] = useState<12 | 24 | 36>(12);

  // Config state
  const [salaryReductionPct, setSalaryReductionPct] = useState(30);
  const [medicalCost, setMedicalCost] = useState('50000');
  const [randomMedical, setRandomMedical] = useState(false);
  const [inflationPct, setInflationPct] = useState(20);
  const [newEmiAmount, setNewEmiAmount] = useState('10000');
  const [loanDuration, setLoanDuration] = useState(24);
  const [compoundJobLoss, setCompoundJobLoss] = useState(true);
  const [compoundMedical, setCompoundMedical] = useState(false);
  const [compoundInflation, setCompoundInflation] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customImpact, setCustomImpact] = useState('');

  const selected = SCENARIOS.find((s) => s.id === selectedId);

  // ── Simulation calculation ──────────────────────────────────────────────────
  const results = useMemo(() => {
    if (!selectedId || !simulated) return null;

    let monthlyIncome = baseIncome;
    let monthlyExpenses = baseExpenses + baseEmis;
    let oneTimeCost = 0;

    switch (selectedId) {
      case 'job-loss':
        monthlyIncome = 0;
        break;
      case 'salary-reduction':
        monthlyIncome = baseIncome * (1 - salaryReductionPct / 100);
        break;
      case 'medical-emergency':
        oneTimeCost = randomMedical
          ? Math.round((50000 + Math.random() * 150000) / 1000) * 1000
          : parseFloat(medicalCost) || 50000;
        break;
      case 'expense-inflation':
        monthlyExpenses = monthlyExpenses * (1 + inflationPct / 100);
        break;
      case 'loan-burden':
        monthlyExpenses += parseFloat(newEmiAmount) || 10000;
        break;
      case 'compound-shock':
        if (compoundJobLoss) monthlyIncome = 0;
        if (compoundInflation) monthlyExpenses = monthlyExpenses * 1.2;
        if (compoundMedical) oneTimeCost = 75000;
        break;
      case 'custom-event':
        oneTimeCost = parseFloat(customImpact) || 0;
        break;
    }

    // Build month-by-month timeline
    let balance = baseSavings - oneTimeCost;
    const timeline = [];
    let survivalMonths = 0;

    for (let m = 0; m <= horizon; m++) {
      const cashFlow = monthlyIncome - monthlyExpenses;
      if (m > 0) balance += cashFlow;
      if (balance > 0 || m === 0) survivalMonths = m;
      timeline.push({
        month: m,
        savings: Math.max(0, Math.round(balance)),
        income: Math.round(monthlyIncome),
        expenses: Math.round(monthlyExpenses),
        cashFlow: Math.round(cashFlow),
      });
      if (balance <= 0 && m > 0) break;
    }

    // Pad to horizon if savings lasted
    while (timeline.length <= horizon) {
      timeline.push({ month: timeline.length, savings: 0, income: Math.round(monthlyIncome), expenses: Math.round(monthlyExpenses), cashFlow: 0 });
    }

    const finalBalance = timeline[Math.min(horizon, timeline.length - 1)].savings;
    const monthlyCashFlow = monthlyIncome - monthlyExpenses;
    const risk = getRisk(survivalMonths);

    // Insights
    const insights: string[] = [];
    if (selectedId === 'job-loss') {
      insights.push(`Savings will be depleted in ~${survivalMonths} months with no income.`);
      insights.push('Reducing expenses by 15% could extend survival by 2–3 months.');
    } else if (selectedId === 'salary-reduction') {
      insights.push(`At ${salaryReductionPct}% income cut, monthly shortfall is ${fmt(Math.abs(monthlyCashFlow))}.`);
      if (monthlyCashFlow < 0) insights.push('Consider reducing discretionary spending immediately.');
    } else if (selectedId === 'medical-emergency') {
      insights.push(`One-time cost of ${fmt(oneTimeCost)} reduces savings to ${fmt(Math.max(0, baseSavings - oneTimeCost))}.`);
      insights.push('Health insurance could have covered a major portion of this cost.');
    } else if (selectedId === 'expense-inflation') {
      insights.push(`${inflationPct}% expense rise adds ${fmt(monthlyExpenses - baseExpenses - baseEmis)} extra per month.`);
      insights.push('Review subscriptions and discretionary expenses to offset inflation.');
    } else if (selectedId === 'loan-burden') {
      insights.push(`New EMI increases monthly outflow to ${fmt(monthlyExpenses)}.`);
      insights.push(`EMI-to-income ratio becomes ${((monthlyExpenses / Math.max(1, baseIncome)) * 100).toFixed(1)}%.`);
    } else if (selectedId === 'compound-shock') {
      insights.push('Multiple shocks dramatically reduce financial resilience.');
      insights.push('Diversifying income streams is the best compound-shock buffer.');
    } else if (selectedId === 'custom-event') {
      insights.push(`Custom impact of ${fmt(oneTimeCost)} reduces your liquid cushion.`);
    }

    return { timeline, survivalMonths, monthlyCashFlow, finalBalance, oneTimeCost, monthlyIncome, monthlyExpenses, risk, insights };
  }, [selectedId, simulated, horizon, salaryReductionPct, medicalCost, randomMedical, inflationPct, newEmiAmount, loanDuration, compoundJobLoss, compoundMedical, compoundInflation, customName, customImpact]);

  const handleRun = () => setSimulated(true);
  const handleReset = () => { setSimulated(false); setSelectedId(null); };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30 pb-28">
      <div className="max-w-md mx-auto">

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Simulation Engine</h1>
          <p className="text-sm text-gray-500 mt-0.5">Test financial scenarios before they happen</p>
        </div>

        {loading && (
          <p className="px-5 text-sm text-blue-600 mb-3">Loading your financial profile...</p>
        )}
        {error && !loading && (
          <p className="px-5 text-sm text-red-600 mb-3">{error}</p>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1 — Scenario Selection
        ══════════════════════════════════════════════════════════════ */}
        <div className="px-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            1 · Choose a Scenario
          </p>
          <div className="space-y-2.5">
            {SCENARIOS.map((s) => {
              const isActive = selectedId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setSelectedId(s.id); setSimulated(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                    isActive
                      ? `${s.bg} ${s.border} shadow-md`
                      : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActive ? s.bg : 'bg-gray-100'} ${isActive ? s.color : 'text-gray-500'}`}>
                    {s.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium text-sm ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>{s.title}</p>
                    <p className="text-xs text-gray-500 truncate">{s.description}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${isActive ? s.color : 'text-gray-300'}`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2 — Configuration Panel
        ══════════════════════════════════════════════════════════════ */}
        {selectedId && (
          <div className="px-5 mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              2 · Configure Parameters
            </p>
            <div className={`rounded-2xl border p-5 ${selected!.bg} ${selected!.border}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${selected!.color} bg-white/70`}>
                  {selected!.icon}
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{selected!.title}</p>
                  <p className="text-xs text-gray-600">{selected!.description}</p>
                </div>
              </div>

              <div className="bg-white/80 rounded-xl p-4 space-y-4">
                {/* ── Job Loss ── */}
                {selectedId === 'job-loss' && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly Income</span>
                      <span className="font-semibold text-red-600">₹0 (lost)</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Monthly Expenses</span>
                      <span className="font-semibold text-gray-900">{fmt(baseExpenses + baseEmis)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Current Savings</span>
                      <span className="font-semibold text-gray-900">{fmt(baseSavings)}</span>
                    </div>
                    <div className="h-px bg-gray-100" />
                    <p className="text-xs text-red-600">Income becomes ₹0. All expenses drain savings.</p>
                  </div>
                )}

                {/* ── Salary Reduction ── */}
                {selectedId === 'salary-reduction' && (
                  <div className="space-y-4">
                    <SliderField
                      label="Income Reduction"
                      min={10} max={90} step={5}
                      value={salaryReductionPct}
                      onChange={setSalaryReductionPct}
                      displayValue={`${salaryReductionPct}%`}
                    />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Reduced Income</p>
                        <p className="font-semibold text-gray-900">{fmt(baseIncome * (1 - salaryReductionPct / 100))}</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Monthly Gap</p>
                        <p className={`font-semibold ${(baseIncome * (1 - salaryReductionPct / 100)) < (baseExpenses + baseEmis) ? 'text-red-600' : 'text-green-600'}`}>
                          {fmt(Math.abs(baseIncome * (1 - salaryReductionPct / 100) - baseExpenses - baseEmis))}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Medical Emergency ── */}
                {selectedId === 'medical-emergency' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-700">Random emergency cost</label>
                      <button
                        type="button"
                        onClick={() => setRandomMedical(!randomMedical)}
                        className={`w-11 h-6 rounded-full transition-colors relative ${randomMedical ? 'bg-blue-500' : 'bg-gray-300'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${randomMedical ? 'left-6' : 'left-1'}`} />
                      </button>
                    </div>
                    {!randomMedical && (
                      <NumberInput label="Medical Cost (₹)" value={medicalCost} onChange={setMedicalCost} placeholder="50000" />
                    )}
                    {randomMedical && (
                      <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">A random cost between ₹50K–₹2L will be applied on simulation.</p>
                    )}
                  </div>
                )}

                {/* ── Expense Inflation ── */}
                {selectedId === 'expense-inflation' && (
                  <div className="space-y-4">
                    <SliderField
                      label="Expense Inflation"
                      min={5} max={100} step={5}
                      value={inflationPct}
                      onChange={setInflationPct}
                      displayValue={`${inflationPct}%`}
                    />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">Current Expenses</p>
                        <p className="font-semibold text-gray-900">{fmt(baseExpenses + baseEmis)}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-xs text-amber-600 mb-1">After Inflation</p>
                        <p className="font-semibold text-amber-700">{fmt((baseExpenses + baseEmis) * (1 + inflationPct / 100))}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Loan Burden ── */}
                {selectedId === 'loan-burden' && (
                  <div className="space-y-4">
                    <NumberInput label="New Monthly EMI (₹)" value={newEmiAmount} onChange={setNewEmiAmount} placeholder="10000" />
                    <SliderField
                      label="Loan Duration"
                      min={6} max={120} step={6}
                      value={loanDuration}
                      onChange={setLoanDuration}
                      displayValue={`${loanDuration} mo`}
                    />
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500 mb-1">EMI/Income Ratio</p>
                        <p className="font-semibold text-gray-900">{(((baseEmis + (parseFloat(newEmiAmount) || 0)) / baseIncome) * 100).toFixed(1)}%</p>
                      </div>
                      <div className="bg-violet-50 rounded-xl p-3">
                        <p className="text-xs text-violet-600 mb-1">Total Outflow</p>
                        <p className="font-semibold text-violet-700">{fmt(baseExpenses + baseEmis + (parseFloat(newEmiAmount) || 0))}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Compound Shock ── */}
                {selectedId === 'compound-shock' && (
                  <div className="space-y-3">
                    <p className="text-xs text-gray-500 mb-2">Select events to combine:</p>
                    {[
                      { label: 'Job Loss', value: compoundJobLoss, set: setCompoundJobLoss },
                      { label: 'Medical Emergency (₹75K)', value: compoundMedical, set: setCompoundMedical },
                      { label: 'Expense Inflation +20%', value: compoundInflation, set: setCompoundInflation },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between py-1">
                        <label className="text-sm text-gray-700">{item.label}</label>
                        <button
                          type="button"
                          onClick={() => item.set(!item.value)}
                          className={`w-11 h-6 rounded-full transition-colors relative ${item.value ? 'bg-pink-500' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${item.value ? 'left-6' : 'left-1'}`} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Custom Event ── */}
                {selectedId === 'custom-event' && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm text-gray-700 mb-1.5 block">Event Name</label>
                      <input
                        type="text" value={customName} onChange={(e) => setCustomName(e.target.value)}
                        placeholder="e.g. Business failure"
                        className="w-full h-11 px-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                    </div>
                    <NumberInput label="Financial Impact (₹)" value={customImpact} onChange={setCustomImpact} placeholder="100000" />
                  </div>
                )}
              </div>

              {/* Run button */}
              <button
                type="button"
                onClick={handleRun}
                className={`w-full h-12 mt-4 rounded-xl font-semibold text-sm text-white shadow-lg transition-all ${selected!.color.replace('text-', 'bg-').replace('-600', '-500')} hover:opacity-90`}
                style={{ background: selectedId === 'job-loss' ? '#ef4444' : selectedId === 'salary-reduction' ? '#f97316' : selectedId === 'medical-emergency' ? '#f43f5e' : selectedId === 'expense-inflation' ? '#f59e0b' : selectedId === 'loan-burden' ? '#8b5cf6' : selectedId === 'compound-shock' ? '#ec4899' : '#3b82f6' }}
              >
                Run Simulation
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            SECTION 3 — Results Dashboard
        ══════════════════════════════════════════════════════════════ */}
        {results && simulated && (
          <div className="px-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                3 · Simulation Results
              </p>
              <button
                type="button" onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            {/* Horizon selector */}
            <div className="flex gap-2">
              {([12, 24, 36] as const).map((h) => (
                <button
                  key={h} type="button"
                  onClick={() => setHorizon(h)}
                  className={`flex-1 h-9 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-1.5 ${horizon === h ? 'bg-blue-500 text-white shadow-md shadow-blue-300' : 'bg-white border border-gray-200 text-gray-600'}`}
                >
                  <CalendarDays className="w-3.5 h-3.5" />
                  {h}M
                </button>
              ))}
            </div>

            {/* Survival months + Risk */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                <p className="text-xs text-gray-500 mb-2">Savings Will Last</p>
                <p className="text-4xl font-bold text-gray-900">{results.survivalMonths}</p>
                <p className="text-xs text-gray-500 mt-1">months</p>
              </div>
              <div className={`rounded-2xl border p-5 text-center ${results.risk.bg} ${results.risk.color.replace('text-', 'border-').replace('-700', '-200')}`}>
                <p className="text-xs text-gray-500 mb-2">Risk Level</p>
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  {results.risk.icon}
                  <p className={`font-bold text-sm ${results.risk.color}`}>{results.risk.label}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Cash flow: {results.monthlyCashFlow >= 0 ? '+' : ''}{fmt(results.monthlyCashFlow)}/mo
                </p>
              </div>
            </div>

            {/* Financial Survival Timeline */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Financial Survival Timeline</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={results.timeline} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={{ value: 'Months', position: 'insideBottom', offset: -2, fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="savings" name="Savings" stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cash Flow Breakdown */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Income vs Expenses</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={results.timeline.filter((_, i) => i % Math.ceil(horizon / 6) === 0)}
                  margin={{ top: 4, right: 4, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => fmt(v)} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Insights Panel */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <Lightbulb className="w-4 h-4 text-blue-500" />
                <p className="text-sm font-semibold text-blue-800">AI Insights</p>
              </div>
              {results.insights.map((insight, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <p className="text-sm text-blue-700">{insight}</p>
                </div>
              ))}
            </div>

            {/* Month-by-month projection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-800 mb-3">Month-by-Month Projection</p>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {results.timeline.map((row) => (
                  <div key={row.month} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500 w-16">Month {row.month}</span>
                    <span className={`text-xs font-medium w-20 text-right ${row.cashFlow >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {row.cashFlow >= 0 ? '+' : ''}{fmt(row.cashFlow)}
                    </span>
                    <span className={`text-xs font-semibold w-20 text-right ${row.savings > 0 ? 'text-gray-900' : 'text-red-500'}`}>
                      {fmt(row.savings)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-2 pt-2 border-t border-gray-100">
                <span>Month</span><span>Cash Flow</span><span>Savings</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!selectedId && (
          <div className="px-5">
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Sliders className="w-7 h-7 text-blue-400" />
              </div>
              <p className="text-gray-700 font-medium text-sm mb-1">Select a scenario above</p>
              <p className="text-xs text-gray-400">Choose one of the 7 scenarios to configure and simulate your financial resilience.</p>
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  );
}

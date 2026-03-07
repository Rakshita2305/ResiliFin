import React, { useEffect, useState } from 'react';
import type { ReactNode, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Wallet,
  PiggyBank,
  Receipt,
  CreditCard,
  TrendingUp,
  Shield,
  User,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Bill {
  id: string;
  billType: string;
  amount: string;
  dueDate: string;
}

interface Loan {
  id: string;
  loanType: string;
  provider: string;
  principalAmount: string;
  interestRate: string;
  startDate: string;
  endDate: string;
  monthlyDueDate: string;
  yearlyDueDate: string;
}

interface Investment {
  id: string;
  investmentType: string;
  amount: string;
  platform: string;
  startDate: string;
  maturityDate: string;
  expectedReturn: string;
}

interface Insurance {
  id: string;
  insuranceType: string;
  provider: string;
  startDate: string;
  endDate: string;
  premiumAmount: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BILL_TYPES = [
  'Mobile Recharge',
  'TV Recharge / DTH',
  'Netflix',
  'Amazon Prime',
  'Disney+ Hotstar',
  'Sony LIV',
  'ZEE5',
  'Spotify / Music',
  'Electric Bill',
  'Internet / WiFi',
  'Gas / LPG',
  'Water Bill',
  'Gym / Fitness',
  'Cloud Storage',
  'News Subscription',
  'Other',
];

const LOAN_TYPES = [
  'Home Loan',
  'Car Loan',
  'Personal Loan',
  'Education Loan',
  'Business Loan',
  'Gold Loan',
  'Two-Wheeler Loan',
  'Consumer Durable Loan',
  'Other',
];

const INVESTMENT_TYPES = [
  'Mutual Fund',
  'Mutual Fund SIP',
  'Stocks / Equity',
  'PPF',
  'NPS',
  'ELSS',
  'Bonds / Debentures',
  'Real Estate',
  'Crypto',
  'SGB (Sovereign Gold Bond)',
  'Gold',
  'Other',
];

const INSURANCE_TYPES = [
  'Health Insurance',
  'Life Insurance',
  'Term Insurance',
  'Vehicle Insurance',
  'Home Insurance',
  'Travel Insurance',
  'Critical Illness',
  'Other',
];

const MONTHLY_DUE_DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const GENDERS = ['Male', 'Female', 'Other', 'Prefer not to say'];

function maskPan(pan: string): string {
  const s = String(pan || '').trim().toUpperCase();
  if (s.length !== 10) return '*****';
  return s.slice(0, 3) + 'XX' + s.slice(-4);
}

// ─── Reusable Field Components ────────────────────────────────────────────────

function Field({
  label, id, type = 'text', placeholder, value, onChange, readOnly,
}: {
  label: string; id: string; type?: string; placeholder?: string; value: string; onChange: (v: string) => void; readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
      </div>
    );
  }
  return (
    <div>
      <Label htmlFor={id} className="text-sm text-gray-700 mb-1.5 block">{label}</Label>
      <Input
        id={id} type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl border-gray-200 text-sm"
      />
    </div>
  );
}

function SelectField({
  label, id, options, value, onChange, placeholder = 'Select…', readOnly,
}: {
  label: string; id: string; options: string[]; value: string; onChange: (v: string) => void; placeholder?: string; readOnly?: boolean;
}) {
  if (readOnly) {
    return (
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
      </div>
    );
  }
  return (
    <div>
      <Label htmlFor={id} className="text-sm text-gray-700 mb-1.5 block">{label}</Label>
      <select
        id={id} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400 appearance-none"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  icon, title, subtitle, color, isOpen, onToggle, children,
}: {
  icon: ReactNode; title: string; subtitle: string; color: string;
  isOpen: boolean; onToggle: () => void; children: ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-md shadow-blue-100/40 border border-gray-100 overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full flex items-center justify-between p-5 text-left">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
          <div>
            <p className="text-gray-900 font-medium">{title}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
        </div>
        {isOpen
          ? <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
          : <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-5 pb-5 border-t border-gray-50 pt-4">{children}</div>
      )}
    </div>
  );
}

// ─── Add Row Button ───────────────────────────────────────────────────────────

function AddRowBtn({ label, onClick, color }: { label: string; onClick: () => void; color: string }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`w-full h-10 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors ${color}`}
    >
      <Plus className="w-4 h-4" /> {label}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProfileSetup() {
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<number | null>(0);
  const toggle = (i: number) => setOpenSection(openSection === i ? null : i);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Personal info (Blinkit-style header + expandable section)
  const [personalOpen, setPersonalOpen] = useState(false);
  const [personal, setPersonal] = useState({
    fullName: '',
    email: '',
    occupation: '',
    gender: '',
    age: '',
    noOfDependants: '0',
    panNumber: '',
    panMasked: '',
    panVerified: false,
  });
  const [panOtp, setPanOtp] = useState('');
  const [panStep, setPanStep] = useState<'idle' | 'otp_sent' | 'verifying'>('idle');
  const [panError, setPanError] = useState<string | null>(null);

  // 1. Basic Finance
  const [basicFinance, setBasicFinance] = useState({ monthlySalary: '', variableExpenses: '' });

  // 2. Savings
  const [liquidSavings, setLiquidSavings] = useState('');
  const [normalSavings, setNormalSavings] = useState({ emergencyFunds: '', fds: '', rds: '' });

  // 3. Bills & Subscriptions — dynamic rows
  const [bills, setBills] = useState<Bill[]>([
    { id: '1', billType: '', amount: '', dueDate: '' },
  ]);
  const addBill = () =>
    setBills([...bills, { id: Date.now().toString(), billType: '', amount: '', dueDate: '' }]);
  const removeBill = (id: string) => setBills(bills.filter((b) => b.id !== id));
  const updateBill = (id: string, field: keyof Bill, value: string) =>
    setBills(bills.map((b) => (b.id === id ? { ...b, [field]: value } : b)));

  // 4. Loans & EMIs
  const newLoan = (): Loan => ({
    id: Date.now().toString(), loanType: '', provider: '', principalAmount: '',
    interestRate: '', startDate: '', endDate: '', monthlyDueDate: '', yearlyDueDate: '',
  });
  const [loans, setLoans] = useState<Loan[]>([{ ...newLoan(), id: '1' }]);
  const addLoan = () => setLoans([...loans, newLoan()]);
  const removeLoan = (id: string) => setLoans(loans.filter((l) => l.id !== id));
  const updateLoan = (id: string, field: keyof Loan, value: string) =>
    setLoans(loans.map((l) => (l.id === id ? { ...l, [field]: value } : l)));

  // 5. Investments
  const newInv = (): Investment => ({
    id: Date.now().toString(), investmentType: '', amount: '', platform: '',
    startDate: '', maturityDate: '', expectedReturn: '',
  });
  const [investments, setInvestments] = useState<Investment[]>([{ ...newInv(), id: '1' }]);
  const addInvestment = () => setInvestments([...investments, newInv()]);
  const removeInvestment = (id: string) => setInvestments(investments.filter((i) => i.id !== id));
  const updateInvestment = (id: string, field: keyof Investment, value: string) =>
    setInvestments(investments.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  // 6. Insurance
  const newIns = (): Insurance => ({
    id: Date.now().toString(), insuranceType: '', provider: '', startDate: '', endDate: '', premiumAmount: '',
  });
  const [insurances, setInsurances] = useState<Insurance[]>([{ ...newIns(), id: '1' }]);
  const addInsurance = () => setInsurances([...insurances, newIns()]);
  const removeInsurance = (id: string) => setInsurances(insurances.filter((i) => i.id !== id));
  const updateInsurance = (id: string, field: keyof Insurance, value: string) =>
    setInsurances(insurances.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  // Load personal info
  const loadPersonal = async (token: string) => {
    try {
      const res = await fetch('http://localhost:4000/api/personal', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPersonal({
          fullName: data.fullName || '',
          email: data.email || '',
          occupation: data.occupation || '',
          gender: data.gender || '',
          age: data.age != null ? String(data.age) : '',
          noOfDependants: data.noOfDependants != null ? String(data.noOfDependants) : '0',
          panNumber: '',
          panMasked: data.panMasked || '',
          panVerified: Boolean(data.panVerified),
        });
      }
    } catch (_) {}
  };

  // Load existing profile from backend
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
      return;
    }
    loadPersonal(token);
    const loadProfile = async () => {
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
          setError('Failed to load profile');
          return;
        }
        const data = await res.json();
        if (data.basicFinance) setBasicFinance(data.basicFinance);
        if (typeof data.liquidSavings === 'string') setLiquidSavings(data.liquidSavings);
        if (data.normalSavings) setNormalSavings(data.normalSavings);
        if (Array.isArray(data.bills) && data.bills.length > 0) {
          setBills(data.bills.map((b: any, idx: number) => ({
            id: String(b.id ?? idx + 1),
            billType: b.billType || '',
            amount: String(b.amount ?? ''),
            dueDate: String(b.dueDate ?? ''),
          })));
        }
        if (Array.isArray(data.loans) && data.loans.length > 0) {
          setLoans(data.loans.map((l: any, idx: number) => ({
            id: String(l.id ?? idx + 1),
            loanType: l.loanType || '',
            provider: l.provider || '',
            principalAmount: String(l.principalAmount ?? ''),
            interestRate: String(l.interestRate ?? ''),
            startDate: l.startDate || '',
            endDate: l.endDate || '',
            monthlyDueDate: String(l.monthlyDueDate ?? ''),
            yearlyDueDate: l.yearlyDueDate || '',
          })));
        }
        if (Array.isArray(data.investments) && data.investments.length > 0) {
          setInvestments(data.investments.map((inv: any, idx: number) => ({
            id: String(inv.id ?? idx + 1),
            investmentType: inv.investmentType || '',
            amount: String(inv.amount ?? ''),
            platform: inv.platform || '',
            startDate: inv.startDate || '',
            maturityDate: inv.maturityDate || '',
            expectedReturn: String(inv.expectedReturn ?? ''),
          })));
        }
        if (Array.isArray(data.insurances) && data.insurances.length > 0) {
          setInsurances(data.insurances.map((ins: any, idx: number) => ({
            id: String(ins.id ?? idx + 1),
            insuranceType: ins.insuranceType || '',
            provider: ins.provider || '',
            premiumAmount: String(ins.premiumAmount ?? ''),
            startDate: ins.startDate || '',
            endDate: ins.endDate || '',
          })));
        }
      } catch (err) {
        console.error(err);
        setError('Unable to load profile');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [navigate]);

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const profile = { basicFinance, liquidSavings, normalSavings, bills, loans, investments, insurances };
      const res = await fetch('http://localhost:4000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem('authToken');
          navigate('/');
          return;
        }
        setError('Failed to save profile');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    const pan = String(personal.panNumber).trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
      setPanError('Invalid PAN. Use format: ABCDE1234F');
      return;
    }
    setPanError(null);
    setPanStep('idle');
    try {
      const res = await fetch('http://localhost:4000/api/personal/pan/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pan }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPanError(data.error || 'Failed to send OTP');
        return;
      }
      setPanStep('otp_sent');
      setPanOtp('');
    } catch (_) {
      setPanError('Unable to connect');
    }
  };

  const handleVerifyPan = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    setPanError(null);
    setPanStep('verifying');
    try {
      const res = await fetch('http://localhost:4000/api/personal/pan/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pan: personal.panNumber.trim().toUpperCase(), otp: panOtp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPanError(data.error || 'Verification failed');
        setPanStep('otp_sent');
        return;
      }
      setPersonal((p) => ({ ...p, panNumber: '', panMasked: data.panMasked || maskPan(personal.panNumber), panVerified: true }));
      setPanStep('idle');
      setPanOtp('');
      if (data.demoData) {
        if (data.demoData.monthlySalary)
          setBasicFinance((prev) => ({ ...prev, monthlySalary: data.demoData.monthlySalary }));
        setLiquidSavings(data.demoData.liquidSavings || '');
        if (data.demoData.normalSavings)
          setNormalSavings(data.demoData.normalSavings);
        if (Array.isArray(data.demoData.loans) && data.demoData.loans.length > 0)
          setLoans(data.demoData.loans.map((l: any, idx: number) => ({
            id: String(l.id ?? idx + 1),
            loanType: l.loanType || '',
            provider: l.provider || '',
            principalAmount: String(l.principalAmount ?? ''),
            interestRate: String(l.interestRate ?? ''),
            startDate: l.startDate || '',
            endDate: l.endDate || '',
            monthlyDueDate: String(l.monthlyDueDate ?? ''),
            yearlyDueDate: l.yearlyDueDate || '',
          })));
        if (Array.isArray(data.demoData.investments) && data.demoData.investments.length > 0)
          setInvestments(data.demoData.investments.map((i: any, idx: number) => ({
            id: String(i.id ?? idx + 1),
            investmentType: i.investmentType || '',
            amount: String(i.amount ?? ''),
            platform: i.platform || '',
            startDate: i.startDate || '',
            maturityDate: i.maturityDate || '',
            expectedReturn: String(i.expectedReturn ?? ''),
          })));
        if (Array.isArray(data.demoData.insurances) && data.demoData.insurances.length > 0)
          setInsurances(data.demoData.insurances.map((ins: any, idx: number) => ({
            id: String(ins.id ?? idx + 1),
            insuranceType: ins.insuranceType || '',
            provider: ins.provider || '',
            premiumAmount: String(ins.premiumAmount ?? ''),
            startDate: ins.startDate || '',
            endDate: ins.endDate || '',
          })));
      }
    } catch (_) {
      setPanError('Unable to connect');
      setPanStep('otp_sent');
    }
  };

  const savePersonalInfo = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) return;
    try {
      await fetch('http://localhost:4000/api/personal', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          fullName: personal.fullName,
          occupation: personal.occupation,
          gender: personal.gender,
          age: personal.age,
          noOfDependants: personal.noOfDependants,
        }),
      });
    } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50/30 pb-10">
      <div className="max-w-md mx-auto p-5">

        {/* Back */}
        <button onClick={() => navigate('/dashboard')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back
        </button>

        {/* Blinkit-style Profile Header */}
        <div className="bg-white rounded-2xl shadow-md shadow-blue-100/40 border border-gray-100 p-5 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                {personal.fullName || personal.email || 'Profile'}
              </h1>
              <p className="text-sm text-gray-500">{personal.email || 'Add your details'}</p>
            </div>
          </div>
        </div>

        {/* Personal info (click to expand) */}
        <div className="bg-white rounded-2xl shadow-md shadow-blue-100/40 border border-gray-100 overflow-hidden mb-4">
          <button
            type="button"
            onClick={() => setPersonalOpen(!personalOpen)}
            className="w-full flex items-center justify-between p-5 text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="text-gray-900 font-medium">Personal Info</p>
                <p className="text-xs text-gray-500">Name, occupation, gender, age, dependants, PAN</p>
              </div>
            </div>
            {personalOpen ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>
          {personalOpen && (
            <div className="px-5 pb-5 border-t border-gray-50 pt-4 space-y-4">
              <Field label="Full Name" id="fullName" value={personal.fullName} onChange={(v) => setPersonal({ ...personal, fullName: v })} placeholder="Your name" />
              <Field label="Occupation" id="occupation" value={personal.occupation} onChange={(v) => setPersonal({ ...personal, occupation: v })} placeholder="e.g. Software Engineer" />
              <SelectField label="Gender" id="gender" options={GENDERS} value={personal.gender} onChange={(v) => setPersonal({ ...personal, gender: v })} placeholder="Select" />
              <Field label="Age" id="age" type="number" value={personal.age} onChange={(v) => setPersonal({ ...personal, age: v })} placeholder="e.g. 28" />
              <Field label="Number of Dependants" id="dependants" type="number" value={personal.noOfDependants} onChange={(v) => setPersonal({ ...personal, noOfDependants: v })} placeholder="0" />
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">PAN Verification</p>
                {personal.panVerified ? (
                  <div className="flex items-center gap-2 text-green-600 text-sm">
                    <Shield className="w-4 h-4" /> Verified: {personal.panMasked || '*****'}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Field label="PAN Number" id="pan" value={personal.panNumber} onChange={(v) => setPersonal({ ...personal, panNumber: v.toUpperCase() })} placeholder="ABCDE1234F" />
                    {panStep === 'otp_sent' && (
                      <>
                        <Field label="Enter OTP" id="otp" type="text" value={panOtp} onChange={setPanOtp} placeholder="Demo: 1234" />
                        <Button type="button" onClick={handleVerifyPan} disabled={panStep === 'verifying'} className="w-full bg-blue-500 text-white">
                          {panStep === 'verifying' ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                      </>
                    )}
                    {panStep === 'idle' && (
                      <Button type="button" onClick={handleSendOtp} className="w-full bg-blue-500 text-white">
                        Send OTP
                      </Button>
                    )}
                    {panError && <p className="text-sm text-red-600">{panError}</p>}
                    <p className="text-xs text-gray-400">Demo OTP: 1234</p>
                  </div>
                )}
              </div>
              <Button type="button" onClick={savePersonalInfo} variant="outline" className="w-full">
                Save Personal Info
              </Button>
            </div>
          )}
        </div>

        {loading && (
          <p className="text-sm text-blue-600 mb-3">Loading profile...</p>
        )}
        {error && (
          <p className="text-sm text-red-600 mb-3">{error}</p>
        )}

        {/* Progress dots */}
        <div className="flex items-center gap-1.5 mb-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i} onClick={() => toggle(i)}
              className={`h-1.5 flex-1 rounded-full cursor-pointer transition-all ${openSection === i ? 'bg-blue-500' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* ── 1. Basic Finance ─────────────────────────────────────── */}
          <SectionCard
            icon={<Wallet className="w-5 h-5 text-blue-600" />}
            title="Basic Finance" subtitle="Income & variable expenses"
            color="bg-blue-50" isOpen={openSection === 0} onToggle={() => toggle(0)}
          >
            <div className="space-y-4">
              <Field label="Monthly Salary (₹)" id="monthlySalary" type="number" placeholder="e.g. 75000"
                value={basicFinance.monthlySalary} onChange={(v) => setBasicFinance({ ...basicFinance, monthlySalary: v })} readOnly={personal.panVerified} />
              <Field label="Variable Expenses (₹)" id="variableExpenses" type="number" placeholder="e.g. 15000"
                value={basicFinance.variableExpenses} onChange={(v) => setBasicFinance({ ...basicFinance, variableExpenses: v })} />
            </div>
          </SectionCard>

          {/* ── 2. Savings ───────────────────────────────────────────── */}
          <SectionCard
            icon={<PiggyBank className="w-5 h-5 text-emerald-600" />}
            title="Savings" subtitle="Liquid & long-term savings"
            color="bg-emerald-50" isOpen={openSection === 1} onToggle={() => toggle(1)}
          >
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Liquid Savings</p>
                <Field label="Liquid Savings Amount (₹)" id="liquidSavings" type="number" placeholder="e.g. 50000"
                  value={liquidSavings} onChange={setLiquidSavings} readOnly={personal.panVerified} />
              </div>
              <div className="h-px bg-gray-100" />
              <div>
                <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-3">Normal Savings</p>
                <div className="space-y-4">
                  <Field label="Emergency Funds (₹)" id="emergencyFunds" type="number" placeholder="e.g. 60000"
                    value={normalSavings.emergencyFunds} onChange={(v) => setNormalSavings({ ...normalSavings, emergencyFunds: v })} readOnly={personal.panVerified} />
                  <Field label="Fixed Deposits — FDs (₹)" id="fds" type="number" placeholder="e.g. 100000"
                    value={normalSavings.fds} onChange={(v) => setNormalSavings({ ...normalSavings, fds: v })} readOnly={personal.panVerified} />
                  <Field label="Recurring Deposits — RDs (₹)" id="rds" type="number" placeholder="e.g. 5000"
                    value={normalSavings.rds} onChange={(v) => setNormalSavings({ ...normalSavings, rds: v })} readOnly={personal.panVerified} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* ── 3. Bills & Subscriptions ─────────────────────────────── */}
          <SectionCard
            icon={<Receipt className="w-5 h-5 text-violet-600" />}
            title="Bills & Subscriptions" subtitle="Monthly recurring payments"
            color="bg-violet-50" isOpen={openSection === 2} onToggle={() => toggle(2)}
          >
            <div className="space-y-4">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_100px_90px_32px] gap-2">
                <span className="text-xs font-medium text-gray-500">Bill / Subscription</span>
                <span className="text-xs font-medium text-gray-500">Amount (₹)</span>
                <span className="text-xs font-medium text-gray-500">Due Date</span>
                <span />
              </div>

              {bills.map((bill, idx) => (
                <div key={bill.id} className="grid grid-cols-[1fr_100px_90px_32px] gap-2 items-end">
                  {/* Bill type dropdown */}
                  <div>
                    {idx === 0 && <Label className="text-xs text-gray-600 mb-1 block invisible">type</Label>}
                    <select
                      value={bill.billType}
                      onChange={(e) => updateBill(bill.id, 'billType', e.target.value)}
                      className="w-full h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none"
                      style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                    >
                      <option value="">Select type</option>
                      {BILL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  {/* Amount */}
                  <Input
                    type="number" placeholder="0"
                    value={bill.amount} onChange={(e) => updateBill(bill.id, 'amount', e.target.value)}
                    className="h-11 rounded-xl border-gray-200 text-sm"
                  />

                  {/* Due date (day of month) */}
                  <select
                    value={bill.dueDate}
                    onChange={(e) => updateBill(bill.id, 'dueDate', e.target.value)}
                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-400 appearance-none text-center"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 6px center' }}
                  >
                    <option value="">Day</option>
                    {MONTHLY_DUE_DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>

                  {/* Remove */}
                  <button
                    type="button" onClick={() => removeBill(bill.id)}
                    className={`h-11 w-8 flex items-center justify-center rounded-xl transition-colors ${bills.length === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-rose-400 hover:bg-rose-50'}`}
                    disabled={bills.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <AddRowBtn label="Add Bill / Subscription" onClick={addBill} color="border-violet-200 text-violet-600 hover:bg-violet-50" />
            </div>
          </SectionCard>

          {/* ── 4. Loans & EMIs ──────────────────────────────────────── */}
          <SectionCard
            icon={<CreditCard className="w-5 h-5 text-rose-600" />}
            title="Loans & EMIs" subtitle="Active loans and repayments"
            color="bg-rose-50" isOpen={openSection === 3} onToggle={() => toggle(3)}
          >
            <div className="space-y-5">
              {loans.map((loan, idx) => (
                <div key={loan.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Loan #{idx + 1}</p>
                    {!personal.panVerified && loans.length > 1 && (
                      <button type="button" onClick={() => removeLoan(loan.id)} className="text-rose-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <SelectField label="Loan Type" id={`loanType-${loan.id}`} options={LOAN_TYPES}
                    value={loan.loanType} onChange={(v) => updateLoan(loan.id, 'loanType', v)} readOnly={personal.panVerified} />
                  <Field label="Lender / Provider" id={`provider-${loan.id}`} placeholder="e.g. HDFC Bank"
                    value={loan.provider} onChange={(v) => updateLoan(loan.id, 'provider', v)} readOnly={personal.panVerified} />
                  <Field label="Principal Amount (₹)" id={`principal-${loan.id}`} type="number" placeholder="e.g. 500000"
                    value={loan.principalAmount} onChange={(v) => updateLoan(loan.id, 'principalAmount', v)} readOnly={personal.panVerified} />
                  <Field label="Interest Rate (% p.a.)" id={`interest-${loan.id}`} type="number" placeholder="e.g. 8.5"
                    value={loan.interestRate} onChange={(v) => updateLoan(loan.id, 'interestRate', v)} readOnly={personal.panVerified} />

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start Date" id={`loanStart-${loan.id}`} type="date" placeholder=""
                      value={loan.startDate} onChange={(v) => updateLoan(loan.id, 'startDate', v)} readOnly={personal.panVerified} />
                    <Field label="End Date" id={`loanEnd-${loan.id}`} type="date" placeholder=""
                      value={loan.endDate} onChange={(v) => updateLoan(loan.id, 'endDate', v)} readOnly={personal.panVerified} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <SelectField
                      label="Monthly Due Date"
                      id={`monthlyDue-${loan.id}`}
                      options={MONTHLY_DUE_DAYS}
                      value={loan.monthlyDueDate}
                      onChange={(v) => updateLoan(loan.id, 'monthlyDueDate', v)}
                      placeholder="Day of month"
                      readOnly={personal.panVerified}
                    />
                    <Field label="Yearly Due Date" id={`yearlyDue-${loan.id}`} type="date" value={loan.yearlyDueDate} onChange={(v) => updateLoan(loan.id, 'yearlyDueDate', v)} readOnly={personal.panVerified} />
                  </div>
                </div>
              ))}
              {!personal.panVerified && (
                <AddRowBtn label="Add Another Loan" onClick={addLoan} color="border-rose-200 text-rose-500 hover:bg-rose-50" />
              )}
            </div>
          </SectionCard>

          {/* ── 5. Investments ───────────────────────────────────────── */}
          <SectionCard
            icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
            title="Investments" subtitle="Mutual funds, stocks & more"
            color="bg-amber-50" isOpen={openSection === 4} onToggle={() => toggle(4)}
          >
            <div className="space-y-5">
              {investments.map((inv, idx) => (
                <div key={inv.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Investment #{idx + 1}</p>
                    {!personal.panVerified && investments.length > 1 && (
                      <button type="button" onClick={() => removeInvestment(inv.id)} className="text-rose-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <SelectField label="Investment Type" id={`invType-${inv.id}`} options={INVESTMENT_TYPES}
                    value={inv.investmentType} onChange={(v) => updateInvestment(inv.id, 'investmentType', v)} readOnly={personal.panVerified} />
                  <Field label="Investment Amount (₹)" id={`invAmount-${inv.id}`} type="number" placeholder="e.g. 50000"
                    value={inv.amount} onChange={(v) => updateInvestment(inv.id, 'amount', v)} readOnly={personal.panVerified} />
                  <Field label="Platform / Broker" id={`platform-${inv.id}`} placeholder="e.g. Zerodha, Groww"
                    value={inv.platform} onChange={(v) => updateInvestment(inv.id, 'platform', v)} readOnly={personal.panVerified} />
                  <Field label="Expected Return (% p.a.)" id={`expectedReturn-${inv.id}`} type="number" placeholder="e.g. 12"
                    value={inv.expectedReturn} onChange={(v) => updateInvestment(inv.id, 'expectedReturn', v)} readOnly={personal.panVerified} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start Date" id={`invStart-${inv.id}`} type="date" placeholder=""
                      value={inv.startDate} onChange={(v) => updateInvestment(inv.id, 'startDate', v)} readOnly={personal.panVerified} />
                    <Field label="Maturity Date" id={`invMaturity-${inv.id}`} type="date" placeholder=""
                      value={inv.maturityDate} onChange={(v) => updateInvestment(inv.id, 'maturityDate', v)} readOnly={personal.panVerified} />
                  </div>
                </div>
              ))}
              {!personal.panVerified && (
                <AddRowBtn label="Add Another Investment" onClick={addInvestment} color="border-amber-200 text-amber-600 hover:bg-amber-50" />
              )}
            </div>
          </SectionCard>

          {/* ── 6. Insurance ─────────────────────────────────────────── */}
          <SectionCard
            icon={<Shield className="w-5 h-5 text-teal-600" />}
            title="Insurance" subtitle="Health, life & general insurance"
            color="bg-teal-50" isOpen={openSection === 5} onToggle={() => toggle(5)}
          >
            <div className="space-y-5">
              {insurances.map((ins, idx) => (
                <div key={ins.id} className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Policy #{idx + 1}</p>
                    {!personal.panVerified && insurances.length > 1 && (
                      <button type="button" onClick={() => removeInsurance(ins.id)} className="text-rose-400 hover:text-rose-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <SelectField label="Insurance Type" id={`insType-${ins.id}`} options={INSURANCE_TYPES}
                    value={ins.insuranceType} onChange={(v) => updateInsurance(ins.id, 'insuranceType', v)} readOnly={personal.panVerified} />
                  <Field label="Provider / Insurer" id={`insProvider-${ins.id}`} placeholder="e.g. LIC, Star Health"
                    value={ins.provider} onChange={(v) => updateInsurance(ins.id, 'provider', v)} readOnly={personal.panVerified} />
                  <Field label="Premium Amount (₹ / month)" id={`premium-${ins.id}`} type="number" placeholder="e.g. 1500"
                    value={ins.premiumAmount} onChange={(v) => updateInsurance(ins.id, 'premiumAmount', v)} readOnly={personal.panVerified} />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start Date" id={`insStart-${ins.id}`} type="date" placeholder=""
                      value={ins.startDate} onChange={(v) => updateInsurance(ins.id, 'startDate', v)} readOnly={personal.panVerified} />
                    <Field label="End Date" id={`insEnd-${ins.id}`} type="date" placeholder=""
                      value={ins.endDate} onChange={(v) => updateInsurance(ins.id, 'endDate', v)} readOnly={personal.panVerified} />
                  </div>
                </div>
              ))}
              {!personal.panVerified && (
                <AddRowBtn label="Add Another Policy" onClick={addInsurance} color="border-teal-200 text-teal-600 hover:bg-teal-50" />
              )}
            </div>
          </SectionCard>

          <Button type="submit" disabled={loading} className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/30 transition-all mt-2 disabled:opacity-60">
            {loading ? 'Saving...' : 'Generate My Financial Health'}
          </Button>
        </form>
      </div>
    </div>
  );
}

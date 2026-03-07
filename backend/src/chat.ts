import 'dotenv/config';
import express, { Response } from 'express';
import { pool } from './db';
import { authMiddleware, AuthRequest } from './middleware';

const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

if (!GROQ_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn(
    '[chat] GROQ_API_KEY is not set in environment. /api/chat will return 500 until it is configured.',
  );
}

interface ChatHistoryItem {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!GROQ_API_KEY) {
    return res.status(500).json({ error: 'Chat service not configured (missing GROQ_API_KEY)' });
  }

  const { message, history } = req.body as {
    message?: string;
    history?: ChatHistoryItem[];
  };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  const lowerMsg = message.toLowerCase();
  const financeKeywords = [
    'money',
    'income',
    'salary',
    'expense',
    'spend',
    'save',
    'savings',
    'investment',
    'invest',
    'loan',
    'emi',
    'debt',
    'credit',
    'card',
    'bank',
    'budget',
    'insurance',
    'mutual fund',
    'sip',
    'interest',
    'financial',
    'finance',
    'goal',
    'retirement',
    'tax',
    'emergency fund',
    'fd',
    'rd',
    'health score',
    'fragility',
    'risk',
  ];

  const isFinanceRelated = financeKeywords.some((k) => lowerMsg.includes(k)) ||
    /₹|\$|eur|rs\.|rs /i.test(message);

  if (!isFinanceRelated) {
    return res.json({
      reply:
        'I can only answer questions related to your personal finances — like income, expenses, savings, EMIs, loans, budgeting, risk, and financial goals. ' +
        'Please ask me something about money or financial planning.',
    });
  }

  try {
    const userId = req.user.userId;

    const [finRows] = await pool.query(
      `SELECT monthly_salary, variable_expenses, liquid_savings,
              emergency_funds, fds_amount, rds_amount
       FROM financial_profiles WHERE user_id = ? LIMIT 1`,
      [userId],
    );
    const fin = (finRows as any[])[0] || null;

    const [loanRows] = await pool.query(
      `SELECT loan_type, principal_amount, interest_rate
       FROM loans WHERE user_id = ?`,
      [userId],
    );
    const loans = loanRows as any[];

    const [billRows] = await pool.query(
      `SELECT bill_type, amount
       FROM bills WHERE user_id = ?`,
      [userId],
    );
    const bills = billRows as any[];

    const [insRows] = await pool.query(
      `SELECT insurance_type, premium_amount
       FROM insurances WHERE user_id = ?`,
      [userId],
    );
    const insurances = insRows as any[];

    const income = Number(fin?.monthly_salary ?? 0);
    const variableExpenses = Number(fin?.variable_expenses ?? 0);
    const liquidSavings = Number(fin?.liquid_savings ?? 0);
    const emergencyFunds = Number(fin?.emergency_funds ?? 0);
    const fds = Number(fin?.fds_amount ?? 0);
    const rds = Number(fin?.rds_amount ?? 0);

    const billsTotal = bills.reduce(
      (sum, b) => sum + Number(b.amount || 0),
      0,
    );
    const insuranceTotal = insurances.reduce(
      (sum, i) => sum + Number(i.premium_amount || 0),
      0,
    );

    const totalMonthlyOutflow = variableExpenses + billsTotal + insuranceTotal;
    const totalSavings = liquidSavings + emergencyFunds + fds + rds;

    const loansSummary = loans
      .map(
        (l) =>
          `${l.loan_type || 'Loan'}: principal ₹${Number(
            l.principal_amount || 0,
          ).toFixed(0)}, rate ${Number(l.interest_rate || 0).toFixed(2)}%`,
      )
      .join('; ');

    const billsSummary = bills
      .map(
        (b) =>
          `${b.bill_type || 'Bill'}: ₹${Number(b.amount || 0).toFixed(0)}/mo`,
      )
      .join('; ');

    const insuranceSummary = insurances
      .map(
        (i) =>
          `${i.insurance_type || 'Insurance'}: ₹${Number(
            i.premium_amount || 0,
          ).toFixed(0)}/mo`,
      )
      .join('; ');

    const profileSummary = `
User financial snapshot (approximate):
- Monthly income: ₹${Number(income).toFixed(0)}
- Variable expenses: ₹${Number(variableExpenses).toFixed(0)}
- Bills: ₹${Number(billsTotal).toFixed(0)}/mo
- Insurance premiums: ₹${Number(insuranceTotal).toFixed(0)}/mo
- Total monthly outflow (excl. EMIs): ₹${Number(totalMonthlyOutflow).toFixed(0)}
- Liquid savings: ₹${Number(liquidSavings).toFixed(0)}
- Emergency funds: ₹${Number(emergencyFunds).toFixed(0)}
- Other savings (FDs, RDs): ₹${Number(fds + rds).toFixed(0)}
- Loans: ${loans.length > 0 ? loansSummary : 'none'}
- Bills detail: ${bills.length > 0 ? billsSummary : 'none'}
- Insurance detail: ${insurances.length > 0 ? insuranceSummary : 'none'}
`.trim();

    const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [];

    messages.push({
      role: 'system',
      content:
        'You are ResiliFin AI, a cautious financial wellness assistant for Indian users. ' +
        'You ONLY answer questions about personal finance: income, expenses, budgeting, savings, emergency funds, loans, EMIs, financial health score, risk, and basic planning. ' +
        'Never give specific stock picks, fund names, crypto, or guaranteed returns. Never discuss non-finance topics. ' +
        'Always give a direct, personalised answer to the user\'s specific question. Do NOT repeat a generic list of capabilities. Use the user\'s financial profile below to tailor your response.',
    });

    messages.push({
      role: 'system',
      content:
        'Here is the user financial profile from the product database. Use it to personalize your answer, but never reveal raw numbers as “database values”; ' +
        'present them naturally as part of your explanation:\n\n' +
        profileSummary,
    });

    if (Array.isArray(history)) {
      history.forEach((h) => {
        if (
          h &&
          (h.role === 'user' || h.role === 'assistant' || h.role === 'system') &&
          typeof h.content === 'string'
        ) {
          messages.push({ role: h.role, content: h.content });
        }
      });
    }

    messages.push({
      role: 'user',
      content: message,
    });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      // eslint-disable-next-line no-console
      console.error('Groq API error:', response.status, text);
      return res.status(500).json({ error: 'Groq API request failed' });
    }

    const data = (await response.json()) as any;
    const reply =
      data?.choices?.[0]?.message?.content ||
      'Sorry, I could not generate a response right now.';

    return res.json({ reply });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


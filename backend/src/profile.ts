import { Router, Response } from 'express';
import { pool } from './db';
import { AuthRequest } from './middleware';

const router = Router();

// Load complete financial profile for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.userId;

    const [finRows] = await pool.query(
      'SELECT monthly_salary, variable_expenses, liquid_savings, emergency_funds, fds_amount, rds_amount FROM financial_profiles WHERE user_id = ? LIMIT 1',
      [userId],
    );
    const fin = (finRows as any[])[0] || null;

    const [bills] = await pool.query(
      'SELECT id, bill_type AS billType, amount, due_day AS dueDate FROM bills WHERE user_id = ? ORDER BY id',
      [userId],
    );

    const [loans] = await pool.query(
      `SELECT
         id,
         loan_type       AS loanType,
         provider,
         principal_amount AS principalAmount,
         interest_rate    AS interestRate,
         start_date       AS startDate,
         end_date         AS endDate,
         monthly_due_day  AS monthlyDueDate,
         yearly_due_date  AS yearlyDueDate
       FROM loans
       WHERE user_id = ?
       ORDER BY id`,
      [userId],
    );

    const [investments] = await pool.query(
      `SELECT
         id,
         investment_type AS investmentType,
         amount,
         platform,
         start_date      AS startDate,
         maturity_date   AS maturityDate,
         expected_return AS expectedReturn
       FROM investments
       WHERE user_id = ?
       ORDER BY id`,
      [userId],
    );

    const [insurances] = await pool.query(
      `SELECT
         id,
         insurance_type AS insuranceType,
         provider,
         premium_amount AS premiumAmount,
         start_date     AS startDate,
         end_date       AS endDate
       FROM insurances
       WHERE user_id = ?
       ORDER BY id`,
      [userId],
    );

    const basicFinance = fin
      ? {
          monthlySalary: String(fin.monthly_salary ?? ''),
          variableExpenses: String(fin.variable_expenses ?? ''),
        }
      : { monthlySalary: '', variableExpenses: '' };

    const liquidSavings = fin ? String(fin.liquid_savings ?? '') : '';
    const normalSavings = fin
      ? {
          emergencyFunds: String(fin.emergency_funds ?? ''),
          fds: String(fin.fds_amount ?? ''),
          rds: String(fin.rds_amount ?? ''),
        }
      : { emergencyFunds: '', fds: '', rds: '' };

    return res.json({
      basicFinance,
      liquidSavings,
      normalSavings,
      bills,
      loans,
      investments,
      insurances,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Save/update complete financial profile for current user
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.userId;

    const {
      basicFinance,
      liquidSavings,
      normalSavings,
      bills,
      loans,
      investments,
      insurances,
    } = req.body as any;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [existingFinRows] = await conn.query(
        'SELECT id FROM financial_profiles WHERE user_id = ? LIMIT 1',
        [userId],
      );
      const existingFin = (existingFinRows as any[])[0] || null;

      const finData = {
        monthly_salary: Number(basicFinance?.monthlySalary || 0),
        variable_expenses: Number(basicFinance?.variableExpenses || 0),
        liquid_savings: Number(liquidSavings || 0),
        emergency_funds: Number(normalSavings?.emergencyFunds || 0),
        fds_amount: Number(normalSavings?.fds || 0),
        rds_amount: Number(normalSavings?.rds || 0),
      };

      if (existingFin) {
        await conn.query(
          `UPDATE financial_profiles
           SET monthly_salary = ?, variable_expenses = ?, liquid_savings = ?,
               emergency_funds = ?, fds_amount = ?, rds_amount = ?, updated_at = NOW()
           WHERE user_id = ?`,
          [
            finData.monthly_salary,
            finData.variable_expenses,
            finData.liquid_savings,
            finData.emergency_funds,
            finData.fds_amount,
            finData.rds_amount,
            userId,
          ],
        );
      } else {
        await conn.query(
          `INSERT INTO financial_profiles
             (user_id, monthly_salary, variable_expenses, liquid_savings,
              emergency_funds, fds_amount, rds_amount, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            userId,
            finData.monthly_salary,
            finData.variable_expenses,
            finData.liquid_savings,
            finData.emergency_funds,
            finData.fds_amount,
            finData.rds_amount,
          ],
        );
      }

      await conn.query('DELETE FROM bills WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM loans WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM investments WHERE user_id = ?', [userId]);
      await conn.query('DELETE FROM insurances WHERE user_id = ?', [userId]);

      if (Array.isArray(bills) && bills.length > 0) {
        const billValues = bills.map((b: any) => [
          userId,
          b.billType || '',
          Number(b.amount || 0),
          Number(b.dueDate || 1),
        ]);
        await conn.query(
          'INSERT INTO bills (user_id, bill_type, amount, due_day, created_at, updated_at) VALUES ?',
          [billValues.map((v) => [...v, new Date(), new Date()])],
        );
      }

      if (Array.isArray(loans) && loans.length > 0) {
        const loanValues = loans.map((l: any) => [
          userId,
          l.loanType || '',
          l.provider || '',
          Number(l.principalAmount || 0),
          Number(l.interestRate || 0),
          l.startDate || null,
          l.endDate || null,
          Number(l.monthlyDueDate || 1),
          l.yearlyDueDate || null,
        ]);
        await conn.query(
          `INSERT INTO loans
             (user_id, loan_type, provider, principal_amount, interest_rate,
              start_date, end_date, monthly_due_day, yearly_due_date, created_at, updated_at)
           VALUES ?`,
          [loanValues.map((v) => [...v, new Date(), new Date()])],
        );
      }

      if (Array.isArray(investments) && investments.length > 0) {
        const invValues = investments.map((i: any) => [
          userId,
          i.investmentType || '',
          Number(i.amount || 0),
          i.platform || '',
          Number(i.expectedReturn || 0),
          i.startDate || null,
          i.maturityDate || null,
        ]);
        await conn.query(
          `INSERT INTO investments
             (user_id, investment_type, amount, platform, expected_return,
              start_date, maturity_date, created_at, updated_at)
           VALUES ?`,
          [invValues.map((v) => [...v, new Date(), new Date()])],
        );
      }

      if (Array.isArray(insurances) && insurances.length > 0) {
        const insValues = insurances.map((ins: any) => [
          userId,
          ins.insuranceType || '',
          ins.provider || '',
          Number(ins.premiumAmount || 0),
          ins.startDate || null,
          ins.endDate || null,
        ]);
        await conn.query(
          `INSERT INTO insurances
             (user_id, insurance_type, provider, premium_amount,
              start_date, end_date, created_at, updated_at)
           VALUES ?`,
          [insValues.map((v) => [...v, new Date(), new Date()])],
        );
      }

      await conn.commit();
      return res.json({ success: true });
    } catch (e) {
      await conn.rollback();
      console.error(e);
      return res.status(500).json({ error: 'Internal server error' });
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


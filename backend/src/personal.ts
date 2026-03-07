import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { pool, demoPool } from './db';
import { AuthRequest } from './middleware';

const router = Router();

function maskPan(pan: string): string {
  const s = String(pan).trim().toUpperCase();
  if (s.length !== 10) return '*****';
  return s.slice(0, 3) + 'XX' + s.slice(-4);
}

// In-memory store for dummy PAN OTP (demo only)
const panOtpStore = new Map<string, { otp: string; expiresAt: number }>();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 min
const DEMO_OTP = '1234';

// Get personal info for current user
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.userId;

    const [rows] = await pool.query(
      `SELECT full_name AS fullName, occupation, gender, age, no_of_dependants AS noOfDependants, pan_masked AS panMasked, pan_verified AS panVerified
       FROM personal_info WHERE user_id = ? LIMIT 1`,
      [userId],
    );
    const row = (rows as any[])[0] || null;

    // Fallback to users table for name/email
    const [userRows] = await pool.query(
      'SELECT full_name, email FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    const user = (userRows as any[])[0] || {};

    return res.json({
      fullName: row?.fullName ?? user.full_name ?? '',
      occupation: row?.occupation ?? '',
      gender: row?.gender ?? '',
      age: row?.age ?? null,
      noOfDependants: row?.noOfDependants ?? 0,
      panMasked: row?.panMasked ?? '',
      panVerified: Boolean(row?.panVerified),
      email: user.email ?? '',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Save personal info
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.userId;
    const { fullName, occupation, gender, age, noOfDependants } = req.body as any;

    const [existing] = await pool.query(
      'SELECT id FROM personal_info WHERE user_id = ? LIMIT 1',
      [userId],
    );
    const hasRow = (existing as any[]).length > 0;

    if (hasRow) {
      await pool.query(
        `UPDATE personal_info
         SET full_name = ?, occupation = ?, gender = ?, age = ?, no_of_dependants = ?, updated_at = NOW()
         WHERE user_id = ?`,
        [
          fullName ?? null,
          occupation ?? null,
          gender ?? null,
          age != null && age !== '' ? Number(age) : null,
          noOfDependants != null && noOfDependants !== '' ? Number(noOfDependants) : 0,
          userId,
        ],
      );
    } else {
      await pool.query(
        `INSERT INTO personal_info (user_id, full_name, occupation, gender, age, no_of_dependants, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          userId,
          fullName ?? null,
          occupation ?? null,
          gender ?? null,
          age != null && age !== '' ? Number(age) : null,
          noOfDependants != null && noOfDependants !== '' ? Number(noOfDependants) : 0,
        ],
      );
    }

    // Also update users.full_name if provided
    if (fullName != null && fullName !== '') {
      await pool.query(
        'UPDATE users SET full_name = ?, updated_at = NOW() WHERE id = ?',
        [fullName, userId],
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Send OTP for PAN verification (dummy)
router.post('/pan/send-otp', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { pan } = req.body as { pan?: string };

    const panStr = String(pan || '').trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panStr)) {
      return res.status(400).json({ error: 'Invalid PAN format. Use e.g. ABCD1234E' });
    }

    const otp = DEMO_OTP;
    panOtpStore.set(panStr, { otp, expiresAt: Date.now() + OTP_EXPIRY_MS });

    return res.json({ success: true, message: 'OTP sent (demo: 1234)' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify PAN OTP and return demo data
router.post('/pan/verify', async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const userId = req.user.userId;
    const { pan, otp } = req.body as { pan?: string; otp?: string };

    const panStr = String(pan || '').trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panStr)) {
      return res.status(400).json({ error: 'Invalid PAN format' });
    }

    const stored = panOtpStore.get(panStr);
    const isValid = stored && stored.otp === String(otp || '').trim() && stored.expiresAt > Date.now();
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    panOtpStore.delete(panStr);

    const panHash = await bcrypt.hash(panStr, 10);
    const panMasked = maskPan(panStr);

    const [existing] = await pool.query(
      'SELECT id FROM personal_info WHERE user_id = ? LIMIT 1',
      [userId],
    );
    const hasRow = (existing as any[]).length > 0;

    if (hasRow) {
      await pool.query(
        'UPDATE personal_info SET pan_hash = ?, pan_masked = ?, pan_verified = 1, updated_at = NOW() WHERE user_id = ?',
        [panHash, panMasked, userId],
      );
    } else {
      await pool.query(
        `INSERT INTO personal_info (user_id, pan_hash, pan_masked, pan_verified, created_at, updated_at)
         VALUES (?, ?, ?, 1, NOW(), NOW())`,
        [userId, panHash, panMasked],
      );
    }

    let demoData;
    try {
      demoData = await getDemoDataFromDb(panStr);
    } catch (e) {
      console.error('Demo DB fetch failed, using fallback:', e);
      demoData = getDemoDataFallback();
    }

    return res.json({ success: true, panVerified: true, panMasked, demoData });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

async function getDemoDataFromDb(panStr: string) {
  const [profRows] = await demoPool.query(
    'SELECT id, pan_hash, liquid_savings, emergency_funds, fds_amount, rds_amount, monthly_salary FROM demo_profiles WHERE pan_hash IS NOT NULL',
  );
  const rows = (profRows as any[]) || [];
  let prof: any = null;
  for (const row of rows) {
    if (row.pan_hash && (await bcrypt.compare(panStr, row.pan_hash))) {
      prof = row;
      break;
    }
  }
  if (!prof) {
    return getDemoDataFallback();
  }

  const demoProfileId = prof.id;

  const [loanRows] = await demoPool.query(
    `SELECT id, loan_type AS loanType, provider, principal_amount AS principalAmount,
            interest_rate AS interestRate, start_date AS startDate, end_date AS endDate,
            monthly_due_day AS monthlyDueDate
     FROM demo_loans WHERE demo_profile_id = ? ORDER BY id`,
    [demoProfileId],
  );

  const [invRows] = await demoPool.query(
    `SELECT id, investment_type AS investmentType, amount, platform,
            start_date AS startDate, maturity_date AS maturityDate, expected_return AS expectedReturn
     FROM demo_investments WHERE demo_profile_id = ? ORDER BY id`,
    [demoProfileId],
  );

  const [insRows] = await demoPool.query(
    `SELECT id, insurance_type AS insuranceType, provider, premium_amount AS premiumAmount,
            start_date AS startDate, end_date AS endDate
     FROM demo_insurances WHERE demo_profile_id = ? ORDER BY id`,
    [demoProfileId],
  );

  const loans = (loanRows as any[]).map((l) => ({
    id: String(l.id),
    loanType: l.loanType || '',
    provider: l.provider || '',
    principalAmount: String(l.principalAmount ?? ''),
    interestRate: String(l.interestRate ?? ''),
    startDate: l.startDate ? String(l.startDate).slice(0, 10) : '',
    endDate: l.endDate ? String(l.endDate).slice(0, 10) : '',
    monthlyDueDate: String(l.monthlyDueDate ?? ''),
    yearlyDueDate: '',
  }));

  const investments = (invRows as any[]).map((i) => ({
    id: String(i.id),
    investmentType: i.investmentType || '',
    amount: String(i.amount ?? ''),
    platform: i.platform || '',
    startDate: i.startDate ? String(i.startDate).slice(0, 10) : '',
    maturityDate: i.maturityDate ? String(i.maturityDate).slice(0, 10) : '',
    expectedReturn: String(i.expectedReturn ?? ''),
  }));

  const insurances = (insRows as any[]).map((ins) => ({
    id: String(ins.id),
    insuranceType: ins.insuranceType || '',
    provider: ins.provider || '',
    premiumAmount: String(ins.premiumAmount ?? ''),
    startDate: ins.startDate ? String(ins.startDate).slice(0, 10) : '',
    endDate: ins.endDate ? String(ins.endDate).slice(0, 10) : '',
  }));

  return {
    monthlySalary: prof.monthly_salary != null ? String(prof.monthly_salary) : '',
    liquidSavings: String(prof.liquid_savings ?? ''),
    normalSavings: {
      emergencyFunds: String(prof.emergency_funds ?? ''),
      fds: String(prof.fds_amount ?? ''),
      rds: String(prof.rds_amount ?? ''),
    },
    loans,
    investments,
    insurances,
  };
}

function getDemoDataFallback() {
  return {
    monthlySalary: '',
    liquidSavings: '',
    normalSavings: { emergencyFunds: '', fds: '', rds: '' },
    loans: [],
    investments: [],
    insurances: [],
  };
}

export default router;

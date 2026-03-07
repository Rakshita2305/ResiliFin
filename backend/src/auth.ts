import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from './db';

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const JWT_EXPIRES_IN = '7d';

interface JwtPayloadData {
  userId: number;
  email: string;
}

function signToken(payload: JwtPayloadData) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName } = req.body as { email?: string; password?: string; fullName?: string };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [existingRows] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    const rows = existingRows as { id: number }[];
    if (rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, full_name, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
      [email, passwordHash, fullName || null],
    );

    const insertResult = result as { insertId: number };
    const token = signToken({ userId: insertResult.insertId, email });

    return res.status(201).json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const [rowsData] = await pool.query('SELECT id, password_hash FROM users WHERE email = ?', [email]);
    const rows = rowsData as { id: number; password_hash: string }[];
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = signToken({ userId: user.id, email });
    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


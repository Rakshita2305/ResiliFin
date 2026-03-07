import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice('Bearer '.length);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; email: string };
    req.user = { userId: decoded.userId, email: decoded.email };
    return next();
  } catch (err) {
    console.error(err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}


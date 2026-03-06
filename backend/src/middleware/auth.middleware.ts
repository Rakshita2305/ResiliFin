import { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from '../utils/jwt';

export interface RequestAuth {
  userId: string;
  role: 'user' | 'admin';
  email: string;
}

export type AuthenticatedRequest = Request & {
  auth?: RequestAuth;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid authorization header' });
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);

    if (payload.type !== 'access') {
      return res.status(401).json({ message: 'Invalid access token type' });
    }

    authReq.auth = {
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    };

    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired access token' });
  }
};

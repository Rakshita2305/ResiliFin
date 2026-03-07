import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import {
  getAccessTokenTtlSeconds,
  getCurrentUser,
  loginWithEmailPassword,
  registerWithEmailPassword,
  logoutSession,
  refreshAuthSession,
} from './auth.local.service';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const result = await registerWithEmailPassword(email, password);

    return res.status(200).json({
      ...result,
      accessTokenExpiresIn: getAccessTokenTtlSeconds(),
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const result = await loginWithEmailPassword(email, password);

    return res.status(200).json({
      ...result,
      accessTokenExpiresIn: getAccessTokenTtlSeconds(),
    });
  } catch (error) {
    return res.status(401).json({ message: (error as Error).message });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken: token } = req.body as { refreshToken?: string };

    if (!token) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }

    const result = await refreshAuthSession(token);

    return res.status(200).json({
      ...result,
      accessTokenExpiresIn: getAccessTokenTtlSeconds(),
    });
  } catch (error) {
    return res.status(401).json({ message: 'Token refresh failed', error: (error as Error).message });
  }
};

export const logout = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body as { refreshToken?: string };

  if (!token) {
    return res.status(400).json({ message: 'refreshToken is required' });
  }

  await logoutSession(token);

  return res.status(200).json({ ok: true });
};

export const me = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const user = await getCurrentUser(authReq.auth.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  return res.status(200).json({ user });
};

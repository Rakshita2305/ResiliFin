import { randomUUID, createHash } from 'crypto';
import { appendFile } from 'fs/promises';
import path from 'path';

import bcrypt from 'bcryptjs';

import { getProfileCompletionStatus } from '../profiles/profile.service';
import { UserSessionModel } from '../sessions/session.model';
import { UserModel } from '../users/user.model';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt';
import { AuthTokens, AuthUser, JwtPayloadBase } from './auth.types';

const hashToken = (value: string): string => createHash('sha256').update(value).digest('hex');
const REGISTER_AUDIT_FILE = path.resolve(process.cwd(), 'src/modules/auth/register-users.log.jsonl');

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const toAuthUser = async (user: {
  _id: { toString: () => string };
  email: string;
  role: 'user' | 'admin';
}): Promise<AuthUser> => {
  const userId = user._id.toString();
  const completion = await getProfileCompletionStatus(userId);

  return {
    id: userId,
    email: user.email,
    role: user.role,
    profileComplete: completion.complete,
  };
};

const issueTokenPair = async (params: {
  userId: string;
  email: string;
  role: 'user' | 'admin';
}): Promise<AuthTokens> => {
  const refreshJti = randomUUID();

  const accessPayload: JwtPayloadBase = {
    sub: params.userId,
    email: params.email,
    role: params.role,
    type: 'access',
  };

  const refreshPayload: JwtPayloadBase = {
    ...accessPayload,
    type: 'refresh',
    jti: refreshJti,
  };

  const accessToken = signAccessToken(accessPayload);
  const refreshToken = signRefreshToken(refreshPayload);

  await UserSessionModel.create({
    userId: params.userId,
    jti: refreshJti,
    refreshTokenHash: hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
  });

  return { accessToken, refreshToken };
};

const writeRegisterAuditLog = async (entry: {
  userId: string;
  email: string;
  createdAt: string;
}) => {
  await appendFile(REGISTER_AUDIT_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
};

export const registerWithEmailPassword = async (
  rawEmail: string,
  password: string,
): Promise<{ tokens: AuthTokens; user: AuthUser }> => {
  const email = rawEmail.trim().toLowerCase();

  if (!isValidEmail(email)) {
    throw new Error('Invalid email format');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const existing = await UserModel.findOne({ email });
  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await UserModel.create({
    email,
    passwordHash,
    role: 'user',
    status: 'active',
    lastLoginAt: new Date(),
  });

  await writeRegisterAuditLog({
    userId: user._id.toString(),
    email: user.email,
    createdAt: new Date().toISOString(),
  });

  const tokens = await issueTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    tokens,
    user: await toAuthUser(user),
  };
};

export const loginWithEmailPassword = async (
  rawEmail: string,
  password: string,
): Promise<{ tokens: AuthTokens; user: AuthUser }> => {
  const email = rawEmail.trim().toLowerCase();
  const user = await UserModel.findOne({ email });

  if (!user || user.status !== 'active') {
    throw new Error('Invalid email or password');
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const tokens = await issueTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    tokens,
    user: await toAuthUser(user),
  };
};

export const refreshAuthSession = async (refreshToken: string): Promise<{ tokens: AuthTokens; user: AuthUser }> => {
  const payload = verifyRefreshToken(refreshToken);

  if (payload.type !== 'refresh' || !payload.jti) {
    throw new Error('Invalid refresh token payload');
  }

  const session = await UserSessionModel.findOne({
    userId: payload.sub,
    jti: payload.jti,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!session || session.refreshTokenHash !== hashToken(refreshToken)) {
    throw new Error('Refresh session not found');
  }

  session.revokedAt = new Date();
  await session.save();

  const user = await UserModel.findById(payload.sub);

  if (!user || user.status !== 'active') {
    throw new Error('User not available for refresh');
  }

  const tokens = await issueTokenPair({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });

  return {
    tokens,
    user: await toAuthUser(user),
  };
};

export const logoutSession = async (refreshToken: string): Promise<void> => {
  let payload: JwtPayloadBase;

  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    return;
  }

  if (!payload.jti || payload.type !== 'refresh') {
    return;
  }

  await UserSessionModel.updateOne(
    {
      userId: payload.sub,
      jti: payload.jti,
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
      },
    },
  );
};

export const getCurrentUser = async (userId: string): Promise<AuthUser | null> => {
  const user = await UserModel.findById(userId);

  if (!user) {
    return null;
  }

  return toAuthUser(user);
};

export const getAccessTokenTtlSeconds = (): number => ACCESS_TOKEN_TTL_SECONDS;

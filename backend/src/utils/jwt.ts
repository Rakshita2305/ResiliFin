import jwt from 'jsonwebtoken';

import { env } from '../config/env';
import { JwtPayloadBase } from '../modules/auth/auth.types';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

export const signAccessToken = (payload: JwtPayloadBase): string =>
  jwt.sign(payload, env.jwtAccessSecret, {
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
  });

export const signRefreshToken = (payload: JwtPayloadBase): string =>
  jwt.sign(payload, env.jwtRefreshSecret, {
    expiresIn: REFRESH_TOKEN_TTL_SECONDS,
  });

export const verifyAccessToken = (token: string): JwtPayloadBase =>
  jwt.verify(token, env.jwtAccessSecret) as JwtPayloadBase;

export const verifyRefreshToken = (token: string): JwtPayloadBase =>
  jwt.verify(token, env.jwtRefreshSecret) as JwtPayloadBase;

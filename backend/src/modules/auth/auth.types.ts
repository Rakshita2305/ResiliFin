export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  profileComplete: boolean;
}

export interface JwtPayloadBase {
  sub: string;
  email: string;
  role: 'user' | 'admin';
  type: 'access' | 'refresh';
  jti?: string;
}

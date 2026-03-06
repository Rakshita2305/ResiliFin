declare namespace Express {
  export interface Request {
    auth?: {
      userId: string;
      role: 'user' | 'admin';
      email: string;
    };
  }
}

export {};

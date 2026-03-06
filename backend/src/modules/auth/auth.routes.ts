import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware';
import { login, logout, me, refreshToken, register } from './auth.controller';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/refresh', refreshToken);
authRouter.post('/logout', logout);
authRouter.get('/me', requireAuth, me);

export default authRouter;

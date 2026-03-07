import cors from 'cors';
import express from 'express';

import healthRouter from './routes/health.route';
import authRouter from './modules/auth/auth.routes';
import profileRouter from './modules/profiles/profile.routes';
import expenseRouter from './modules/expenses/expense.routes';
import loanRouter from './modules/liabilities/loan.routes';
import analyticsRouter from './modules/analytics/analytics.routes';
import financeRouter from './modules/finance/finance.routes';

export const createApp = () => {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api', (_req, res) => {
    res.status(200).json({ message: 'ResiliFin backend up' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/profile', profileRouter);
  app.use('/api/expenses', expenseRouter);
  app.use('/api/liabilities', loanRouter);
  app.use('/api/finance', financeRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/health', healthRouter);

  return app;
};

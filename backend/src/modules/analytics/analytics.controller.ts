import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { getAnalyticsSummary } from './analytics.service';

export const getAnalyticsSummaryHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const summary = await getAnalyticsSummary(authReq.auth.userId);
  return res.status(200).json({ summary });
};

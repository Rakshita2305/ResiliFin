import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware';
import { getAnalyticsSummaryHandler } from './analytics.controller';

const analyticsRouter = Router();

analyticsRouter.use(requireAuth);
analyticsRouter.get('/summary', getAnalyticsSummaryHandler);

export default analyticsRouter;

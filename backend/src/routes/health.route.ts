import { Router } from 'express';

const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    ok: true,
    service: 'resilifin-backend',
    timestamp: new Date().toISOString(),
  });
});

export default healthRouter;

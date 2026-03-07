import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { logger } from '../../utils/logger';
import { getProfileByUserId, getProfileCompletionStatus, upsertProfileByUserId } from './profile.service';

export const getMyProfile = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const profile = await getProfileByUserId(authReq.auth.userId);
  const completion = await getProfileCompletionStatus(authReq.auth.userId);

  return res.status(200).json({
    profile,
    completion,
  });
};

export const upsertMyProfile = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
  const { reasonTag: _ignoredReasonTag, ...profileInput } = req.body ?? {};

  logger.info(
    `Profile upsert requested for user=${authReq.auth.userId} reason=${reasonTag ?? 'n/a'} keys=${Object.keys(profileInput).join(',')}`,
  );

  try {
    const profile = await upsertProfileByUserId({
      userId: authReq.auth.userId,
      input: profileInput,
      reasonTag,
    });

    const completion = await getProfileCompletionStatus(authReq.auth.userId);

    logger.info(
      `Profile upsert success for user=${authReq.auth.userId} fullName=${profile.fullName ?? ''} salary=${String(profile.monthlySalaryApprox ?? '')} varExpense=${String(profile.variableExpenseBaseline ?? '')} complete=${completion.complete}`,
    );

    return res.status(200).json({
      profile,
      completion,
    });
  } catch (error) {
    logger.error(`Profile upsert failed for user=${authReq.auth.userId}`, error);
    return res.status(400).json({
      message: (error as Error).message,
    });
  }
};

export const getMyProfileCompletion = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const completion = await getProfileCompletionStatus(authReq.auth.userId);
  return res.status(200).json(completion);
};

import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import {
  createBillSubscriptionEntry,
  createInsuranceEntry,
  createInvestmentEntry,
  createLoanEntry,
  createSavingsEntry,
  deleteBillSubscriptionEntry,
  deleteInsuranceEntry,
  deleteInvestmentEntry,
  deleteLoanEntry,
  deleteSavingsEntry,
  listBillSubscriptionEntries,
  listInsuranceEntries,
  listInvestmentEntries,
  listLoanEntries,
  listSavingsEntriesWithProjection,
  refreshInvestmentFromMarket,
  updateBillSubscriptionEntry,
  updateInsuranceEntry,
  updateInvestmentEntry,
  updateLoanEntry,
  updateSavingsEntry,
} from './finance.service';

export const createSavingsHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};

    const savings = await createSavingsEntry({ userId: authReq.auth.userId, input, reasonTag });
    return res.status(201).json({ savings });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const listSavingsHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const savings = await listSavingsEntriesWithProjection(authReq.auth.userId);
  return res.status(200).json({ savings });
};

export const updateSavingsHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};
    const savings = await updateSavingsEntry({ userId: authReq.auth.userId, entryId, input, reasonTag });
    return res.status(200).json({ savings });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteSavingsHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    await deleteSavingsEntry({ userId: authReq.auth.userId, entryId, reasonTag });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const createInvestmentHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};
    const investment = await createInvestmentEntry({ userId: authReq.auth.userId, input, reasonTag });
    return res.status(201).json({ investment });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const listInvestmentHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const investments = await listInvestmentEntries(authReq.auth.userId);
  return res.status(200).json({ investments });
};

export const updateInvestmentHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};
    const investment = await updateInvestmentEntry({ userId: authReq.auth.userId, entryId, input, reasonTag });
    return res.status(200).json({ investment });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteInvestmentHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    await deleteInvestmentEntry({ userId: authReq.auth.userId, entryId, reasonTag });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const refreshInvestmentMarketHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const investment = await refreshInvestmentFromMarket({
      userId: authReq.auth.userId,
      entryId,
      reasonTag: 'investment-market-refresh-api',
    });

    return res.status(200).json({ investment });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const createInsuranceHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};
    const insurance = await createInsuranceEntry({ userId: authReq.auth.userId, input, reasonTag });
    return res.status(201).json({ insurance });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const listInsuranceHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const insurance = await listInsuranceEntries(authReq.auth.userId);
  return res.status(200).json({ insurance });
};

export const updateInsuranceHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};
    const insurance = await updateInsuranceEntry({ userId: authReq.auth.userId, entryId, input, reasonTag });
    return res.status(200).json({ insurance });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteInsuranceHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    await deleteInsuranceEntry({ userId: authReq.auth.userId, entryId, reasonTag });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const createLoanHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};
    const loan = await createLoanEntry({ userId: authReq.auth.userId, input, reasonTag });
    return res.status(201).json({ loan });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const listLoanHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const loans = await listLoanEntries(authReq.auth.userId);
  return res.status(200).json({ loans });
};

export const updateLoanHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};
    const loan = await updateLoanEntry({ userId: authReq.auth.userId, entryId, input, reasonTag });
    return res.status(200).json({ loan });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteLoanHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    await deleteLoanEntry({ userId: authReq.auth.userId, entryId, reasonTag });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const createBillSubscriptionHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};
    const billSubscription = await createBillSubscriptionEntry({ userId: authReq.auth.userId, input, reasonTag });
    return res.status(201).json({ billSubscription });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const listBillSubscriptionHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const billSubscriptions = await listBillSubscriptionEntries(authReq.auth.userId);
  return res.status(200).json({ billSubscriptions });
};

export const updateBillSubscriptionHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};
    const billSubscription = await updateBillSubscriptionEntry({ userId: authReq.auth.userId, entryId, input, reasonTag });
    return res.status(200).json({ billSubscription });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteBillSubscriptionHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const entryId = req.params.entryId;
    if (!entryId) {
      return res.status(400).json({ message: 'entryId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    await deleteBillSubscriptionEntry({ userId: authReq.auth.userId, entryId, reasonTag });
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

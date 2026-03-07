import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { createLoan, deleteLoan, listLoans, updateLoan } from './loan.service';

export const createLoanHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};

    const loan = await createLoan({
      userId: authReq.auth.userId,
      input,
      reasonTag,
    });

    return res.status(201).json({ loan });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const listLoansHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const loans = await listLoans({ userId: authReq.auth.userId, limit });
  return res.status(200).json({ loans });
};

export const updateLoanHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const loanId = req.params.loanId;
    if (!loanId) {
      return res.status(400).json({ message: 'loanId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};

    const loan = await updateLoan({
      userId: authReq.auth.userId,
      loanId,
      input,
      reasonTag,
    });

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
    const loanId = req.params.loanId;
    if (!loanId) {
      return res.status(400).json({ message: 'loanId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    await deleteLoan({
      userId: authReq.auth.userId,
      loanId,
      reasonTag,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

import { Request, Response } from 'express';

import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import {
  createManualExpense,
  createRecurringExpense,
  deleteManualExpense,
  deleteRecurringExpense,
  listManualExpenses,
  listRecurringExpenses,
  updateManualExpense,
  updateRecurringExpense,
} from './expense.service';
import { listStatementCycles, trackStatementUploadCycle } from './statement-cycle.service';
import { scanStatementContent } from './statement-scan.service';
import { extractStatementTextFromUpload } from './statement-upload.service';

export const createManualExpenseHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};

    const expense = await createManualExpense({
      userId: authReq.auth.userId,
      input,
      reasonTag,
    });

    return res.status(201).json({ expense });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const listManualExpensesHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const expenses = await listManualExpenses({ userId: authReq.auth.userId, limit });
  return res.status(200).json({ expenses });
};

export const updateManualExpenseHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const expenseId = req.params.expenseId;
    if (!expenseId) {
      return res.status(400).json({ message: 'expenseId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};

    const expense = await updateManualExpense({
      userId: authReq.auth.userId,
      expenseId,
      input,
      reasonTag,
    });

    return res.status(200).json({ expense });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteManualExpenseHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const expenseId = req.params.expenseId;
    if (!expenseId) {
      return res.status(400).json({ message: 'expenseId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    await deleteManualExpense({
      userId: authReq.auth.userId,
      expenseId,
      reasonTag,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const createRecurringExpenseHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};

    const recurringExpense = await createRecurringExpense({
      userId: authReq.auth.userId,
      input,
      reasonTag,
    });

    return res.status(201).json({ recurringExpense });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const listRecurringExpensesHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const recurringExpenses = await listRecurringExpenses({ userId: authReq.auth.userId, limit });
  return res.status(200).json({ recurringExpenses });
};

export const updateRecurringExpenseHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const expenseId = req.params.expenseId;
    if (!expenseId) {
      return res.status(400).json({ message: 'expenseId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    const { reasonTag: _ignoredReasonTag, ...input } = req.body ?? {};

    const recurringExpense = await updateRecurringExpense({
      userId: authReq.auth.userId,
      expenseId,
      input,
      reasonTag,
    });

    return res.status(200).json({ recurringExpense });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const deleteRecurringExpenseHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const expenseId = req.params.expenseId;
    if (!expenseId) {
      return res.status(400).json({ message: 'expenseId is required' });
    }

    const reasonTag = typeof req.body?.reasonTag === 'string' ? req.body.reasonTag : undefined;
    await deleteRecurringExpense({
      userId: authReq.auth.userId,
      expenseId,
      reasonTag,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const scanStatementHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const { content, contentBase64 } = req.body as { content?: string; contentBase64?: string };

    let statementText = '';

    if (typeof content === 'string' && content.trim().length > 0) {
      statementText = content;
    } else if (typeof contentBase64 === 'string' && contentBase64.trim().length > 0) {
      statementText = Buffer.from(contentBase64, 'base64').toString('utf8');
    }

    if (!statementText.trim()) {
      return res.status(400).json({ message: 'content or contentBase64 is required' });
    }

    const summary = scanStatementContent(statementText);

    return res.status(200).json({
      summary,
      note: 'Statement content was processed in memory only and not stored.',
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const scanStatementUploadHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const uploaded = (req as Request & { file?: Express.Multer.File }).file;
    const statementPassword =
      typeof req.body?.statementPassword === 'string'
        ? req.body.statementPassword
        : typeof req.body?.password === 'string'
          ? req.body.password
          : undefined;

    if (!uploaded) {
      return res.status(400).json({ message: 'statement file is required' });
    }

    if (uploaded.size > 15 * 1024 * 1024) {
      return res.status(400).json({ message: 'File too large. Max 15MB allowed.' });
    }

    const content = await extractStatementTextFromUpload({
      buffer: uploaded.buffer,
      mimetype: uploaded.mimetype,
      password: statementPassword,
    });

    if (!content.trim()) {
      return res.status(400).json({ message: 'Could not extract readable text from uploaded statement.' });
    }

    const summary = scanStatementContent(content);
    const trackedCycle = await trackStatementUploadCycle({
      userId: authReq.auth.userId,
      summary,
    });

    return res.status(200).json({
      summary,
      cycle: {
        startsNewCycle: trackedCycle.startsNewCycle,
        previousUploadAt: trackedCycle.previousUploadAt,
        daysSinceLastUpload: trackedCycle.daysSinceLastUpload,
        retainedCycles: trackedCycle.retainedCycles,
        maxCycles: trackedCycle.maxCycles,
      },
      note: 'Uploaded statement was processed in memory only and not stored.',
    });
  } catch (error) {
    return res.status(400).json({ message: (error as Error).message });
  }
};

export const listStatementCyclesHandler = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;

  if (!authReq.auth?.userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const cycles = await listStatementCycles(authReq.auth.userId);
  return res.status(200).json({ cycles });
};

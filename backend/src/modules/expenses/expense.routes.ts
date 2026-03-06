import { Router } from 'express';
import multer from 'multer';

import { requireAuth } from '../../middleware/auth.middleware';
import {
	createManualExpenseHandler,
	createRecurringExpenseHandler,
	deleteManualExpenseHandler,
	deleteRecurringExpenseHandler,
	listManualExpensesHandler,
	listRecurringExpensesHandler,
	listStatementCyclesHandler,
	scanStatementHandler,
	scanStatementUploadHandler,
	updateManualExpenseHandler,
	updateRecurringExpenseHandler,
} from './expense.controller';

const expenseRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

expenseRouter.use(requireAuth);
expenseRouter.post('/manual', createManualExpenseHandler);
expenseRouter.get('/manual', listManualExpensesHandler);
expenseRouter.patch('/manual/:expenseId', updateManualExpenseHandler);
expenseRouter.delete('/manual/:expenseId', deleteManualExpenseHandler);
expenseRouter.post('/recurring', createRecurringExpenseHandler);
expenseRouter.get('/recurring', listRecurringExpensesHandler);
expenseRouter.patch('/recurring/:expenseId', updateRecurringExpenseHandler);
expenseRouter.delete('/recurring/:expenseId', deleteRecurringExpenseHandler);
expenseRouter.post('/scan-statement', scanStatementHandler);
expenseRouter.post('/scan-statement-upload', upload.single('statement'), scanStatementUploadHandler);
expenseRouter.get('/statement-cycles', listStatementCyclesHandler);

export default expenseRouter;

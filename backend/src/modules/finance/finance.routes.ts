import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware';
import {
  createInsuranceHandler,
  createInvestmentHandler,
  createBillSubscriptionHandler,
  createLoanHandler,
  createSavingsHandler,
  deleteBillSubscriptionHandler,
  deleteInsuranceHandler,
  deleteInvestmentHandler,
  deleteLoanHandler,
  deleteSavingsHandler,
  listBillSubscriptionHandler,
  listInsuranceHandler,
  listInvestmentHandler,
  listLoanHandler,
  listSavingsHandler,
  refreshInvestmentMarketHandler,
  updateInsuranceHandler,
  updateInvestmentHandler,
  updateBillSubscriptionHandler,
  updateLoanHandler,
  updateSavingsHandler,
} from './finance.controller';

const financeRouter = Router();

financeRouter.use(requireAuth);

financeRouter.post('/savings', createSavingsHandler);
financeRouter.get('/savings', listSavingsHandler);
financeRouter.patch('/savings/:entryId', updateSavingsHandler);
financeRouter.delete('/savings/:entryId', deleteSavingsHandler);

financeRouter.post('/investments', createInvestmentHandler);
financeRouter.get('/investments', listInvestmentHandler);
financeRouter.patch('/investments/:entryId', updateInvestmentHandler);
financeRouter.delete('/investments/:entryId', deleteInvestmentHandler);
financeRouter.post('/investments/:entryId/refresh-market', refreshInvestmentMarketHandler);

financeRouter.post('/insurance', createInsuranceHandler);
financeRouter.get('/insurance', listInsuranceHandler);
financeRouter.patch('/insurance/:entryId', updateInsuranceHandler);
financeRouter.delete('/insurance/:entryId', deleteInsuranceHandler);

financeRouter.post('/loans', createLoanHandler);
financeRouter.get('/loans', listLoanHandler);
financeRouter.patch('/loans/:entryId', updateLoanHandler);
financeRouter.delete('/loans/:entryId', deleteLoanHandler);

financeRouter.post('/bill-subscriptions', createBillSubscriptionHandler);
financeRouter.get('/bill-subscriptions', listBillSubscriptionHandler);
financeRouter.patch('/bill-subscriptions/:entryId', updateBillSubscriptionHandler);
financeRouter.delete('/bill-subscriptions/:entryId', deleteBillSubscriptionHandler);

export default financeRouter;

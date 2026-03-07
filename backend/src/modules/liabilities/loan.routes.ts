import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware';
import { createLoanHandler, deleteLoanHandler, listLoansHandler, updateLoanHandler } from './loan.controller';

const loanRouter = Router();

loanRouter.use(requireAuth);
loanRouter.post('/loans', createLoanHandler);
loanRouter.get('/loans', listLoansHandler);
loanRouter.patch('/loans/:loanId', updateLoanHandler);
loanRouter.delete('/loans/:loanId', deleteLoanHandler);

export default loanRouter;

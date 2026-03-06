import { Router } from 'express';

import { requireAuth } from '../../middleware/auth.middleware';
import { getMyProfile, getMyProfileCompletion, upsertMyProfile } from './profile.controller';

const profileRouter = Router();

profileRouter.use(requireAuth);
profileRouter.get('/me', getMyProfile);
profileRouter.put('/me', upsertMyProfile);
profileRouter.get('/me/completion', getMyProfileCompletion);

export default profileRouter;

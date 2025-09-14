import { Router } from 'express';

import { tokenValidation } from '../middlewares/tokenValidation';
import { getCampaignListByUserHandler } from '../controllers/claim.controller';

const router = Router();

router.get('/campaignlist', tokenValidation, getCampaignListByUserHandler);

export default router;
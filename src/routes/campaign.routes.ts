import { Router } from 'express';

import { tokenValidation } from '../middlewares/tokenValidation';
import { createCampaignHandler, getCampaignListHandler } from '../controllers/campaign.controller';

const router = Router();

router.post("/", tokenValidation, createCampaignHandler);
router.get("/list", getCampaignListHandler);

export default router;
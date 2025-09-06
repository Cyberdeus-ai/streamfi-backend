import { Router } from 'express';

import { tokenValidation } from '../middlewares/tokenValidation';
import { getGainScoreListByCampaignHandler, getScoreListByCampaignHandler } from '../controllers/score.controller';

const router = Router();

router.post("/toplist", getScoreListByCampaignHandler);
router.post("/list", getGainScoreListByCampaignHandler);

export default router;
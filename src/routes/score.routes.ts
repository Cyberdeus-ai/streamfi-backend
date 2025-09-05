import { Router } from 'express';

import { tokenValidation } from '../middlewares/tokenValidation';
import { getGainScoreListByCampaignHandler, getScoreListByCampaignHandler } from '../controllers/score.controller';

const router = Router();

router.post("/list", getScoreListByCampaignHandler);
router.post("/toplist", getGainScoreListByCampaignHandler);

export default router;
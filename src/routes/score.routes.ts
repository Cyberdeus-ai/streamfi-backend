import { Router } from 'express';

import { tokenValidation } from '../middlewares/tokenValidation';
import { getScoreListByCampaignHandler } from '../controllers/score.controller';

const router = Router();

router.post("/list", getScoreListByCampaignHandler);

export default router;
import { Router } from 'express';

import { tokenValidation } from '../middlewares/tokenValidation';
import { getBadUserListHandler } from '../controllers/oversight.controller';

const router = Router();

router.get("/", tokenValidation, getBadUserListHandler);

export default router;
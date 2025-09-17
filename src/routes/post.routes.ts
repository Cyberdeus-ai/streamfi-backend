import { Router } from 'express';

import { tokenValidation } from '../middlewares/tokenValidation';
import { testFunc } from '../controllers/post.controller';

const router = Router();

router.post("/test", tokenValidation, testFunc);

export default router;
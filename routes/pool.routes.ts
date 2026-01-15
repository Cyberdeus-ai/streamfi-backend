import { Router } from 'express'; 

import { 
    getPoolListHandler,
    checkSuperTokenHandler,
    createPoolHandler,
    updatePoolHandler
} from "../controllers/pool.controller";

const router = Router();

router.get('/:userId', getPoolListHandler);
router.post('/check', checkSuperTokenHandler);
router.post('/', createPoolHandler);
router.put('/:poolId', updatePoolHandler);

export default router;


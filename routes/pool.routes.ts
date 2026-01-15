import { Router } from 'express'; 

import { 
    getPoolListHandler,
    checkSuperTokenHandler,
    createPoolHandler,
    updatePoolHandler
} from "../controllers/pool.controller";

const router = Router();

router.get('/:id', getPoolListHandler);
router.post('/check', checkSuperTokenHandler);
router.post('/', createPoolHandler);
router.put('/:id', updatePoolHandler);

export default router;


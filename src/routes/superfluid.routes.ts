import { Router } from "express";

const router = Router();

import { tokenValidation } from "../middlewares/tokenValidation";
import {
    deleteStreamHandler,
    getSuperFluidBalanceHandler,
    getSuperFluidHealthHandler,
    getSuperFluidInfoHandler,
    setStreamBasedOnScore,
    updatePoolMemberUnitsHandler,
    distributeInstantHandler,
    createFlowIntoPoolHandler,
    updateFlowIntoPoolHandler,
    deleteFlowIntoPoolHandler,
} from "../controllers/superfluid.controller";

router.post('/stream-based-on-score', tokenValidation, setStreamBasedOnScore);
router.get('/superfluid-health', tokenValidation, getSuperFluidHealthHandler);
router.get('/stream-info/:userAddress', tokenValidation, getSuperFluidInfoHandler);
router.get('/superfluid-balance', tokenValidation, getSuperFluidBalanceHandler);
router.delete('/stream/:userAddress', tokenValidation, deleteStreamHandler);

router.post('/pool/:poolAddress/member-units', tokenValidation, updatePoolMemberUnitsHandler);
router.post('/pool/:poolAddress/distribute', tokenValidation, distributeInstantHandler);
router.post('/pool/:poolAddress/flow', tokenValidation, createFlowIntoPoolHandler);
router.patch('/pool/:poolAddress/flow', tokenValidation, updateFlowIntoPoolHandler);
router.delete('/pool/:poolAddress/flow', tokenValidation, deleteFlowIntoPoolHandler);

export default router;
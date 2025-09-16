import { Router } from "express";

const router = Router();

import { tokenValidation } from "../middlewares/tokenValidation";
import {
    deleteStreamHandler,
    getSuperFluidBalanceHandler,
    getSuperFluidHealthHandler,
    getSuperFluidInfoHandler,
    setStreamHandler,
    updatePoolMemberUnitsHandler,
    distributeFlowHandler,
    connectPoolHandler,
    disconnectPoolHandler
} from "../controllers/superfluid.controller";

router.post('/stream', tokenValidation, setStreamHandler);
router.get('/superfluid-health', tokenValidation, getSuperFluidHealthHandler);
router.get('/stream-info/:userAddress', tokenValidation, getSuperFluidInfoHandler);
router.get('/superfluid-balance', tokenValidation, getSuperFluidBalanceHandler);
router.delete('/stream/:userAddress', tokenValidation, deleteStreamHandler);

router.post('/pool/:poolAddress/member-units', tokenValidation, updatePoolMemberUnitsHandler);
router.post('/pool/:poolAddress/distribute-flow', tokenValidation, distributeFlowHandler);
router.get('/pool/connect/:memberAddress', tokenValidation, connectPoolHandler);
router.get('/pool/disconnect/:memberAddress', tokenValidation, disconnectPoolHandler);

export default router;
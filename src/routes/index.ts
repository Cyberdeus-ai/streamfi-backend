import { Router } from "express";

import authRouter from "./auth.routes";
import campaignRouter from "./campaign.routes";
import scoreRouter from "./score.routes";
import superfluidRouter from "./superfluid.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/campaign", campaignRouter);
router.use("/score", scoreRouter);
router.use("/superfluid", superfluidRouter);

export default router;
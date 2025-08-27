import { Router } from "express";

import authRouter from "./auth.routes";
import campaignRouter from "./campaign.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/campaign", campaignRouter);

export default router;
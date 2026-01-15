import { Router } from "express";

import authRouter from "./auth.routes";
import campaignRouter from "./campaign.routes";
import poolRouter from "./pool.routes";
import uploadRouter from "./upload.routes";
import dashboardRouter from "./dashboard.routes";
import joinRouter from "./join.routes";

import { tokenValidation } from "../middlewares/tokenValidation";

const router = Router();

router.use("/auth", authRouter);
router.use("/campaign", tokenValidation, campaignRouter);
router.use("/pool", tokenValidation, poolRouter);
router.use("/upload", tokenValidation, uploadRouter);
router.use("/dashboard", tokenValidation, dashboardRouter);
router.use("/join", tokenValidation, joinRouter);

export default router;
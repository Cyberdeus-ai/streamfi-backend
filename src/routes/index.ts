import { Router } from "express";

import authRouter from "./auth.routes";
import campaignRouter from "./campaign.routes";
import scoreRouter from "./score.routes";
import superfluidRouter from "./superfluid.routes";
import oversightRouter from "./oversight.routes";
import claimRouter from "./claim.routes";
import postRouter from "./post.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/campaign", campaignRouter);
router.use("/score", scoreRouter);
router.use("/superfluid", superfluidRouter);
router.use("/oversight", oversightRouter);
router.use("/claim", claimRouter);
router.use("/post", postRouter);

export default router;
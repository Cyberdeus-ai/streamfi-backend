import { Router } from "express";

import { saveJoinHandler } from "../controllers/join.controller";

const router = Router();

router.post('/', saveJoinHandler);

export default router;
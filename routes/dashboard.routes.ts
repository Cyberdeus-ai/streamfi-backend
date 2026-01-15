import { Router } from 'express'; 

import {
    getAdminDashboardStatsHandler,
    getPromoterDashboardStatsHandler
} from '../controllers/dashboard.controller';

const router = Router();

router.get('/admin/:id', getAdminDashboardStatsHandler);
router.get('/promoter/:id', getPromoterDashboardStatsHandler);

export default router;
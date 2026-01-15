import { Router } from 'express'; 

import {
    getAdminDashboardHandler,
    getPromoterDashboardHandler
} from '../controllers/dashboard.controller';

const router = Router();

router.get('/admin/:userId', getAdminDashboardHandler);
router.get('/promoter/:userId', getPromoterDashboardHandler);

export default router;
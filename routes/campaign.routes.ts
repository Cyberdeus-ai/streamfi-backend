import { Router } from 'express'; 

import { 
    getCampaignListHandler,
    createCampaignHandler, 
    updateCampaignHandler, 
    deleteCampaignHandler,
} from "../controllers/campaign.controller";

const router = Router();

router.get('/', getCampaignListHandler);
router.post('/', createCampaignHandler);
router.put('/:campaignId', updateCampaignHandler);
router.delete('/:campaignId', deleteCampaignHandler);

export default router;
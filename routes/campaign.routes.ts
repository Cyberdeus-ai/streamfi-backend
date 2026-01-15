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
router.put('/:id', updateCampaignHandler);
router.delete('/:id', deleteCampaignHandler);

export default router;
import { Request, Response, NextFunction } from 'express';
import {
    saveCampaign,
    findCampaignList,
    updateCampaign,
    deleteCampaign
} from '../services/campaign.service';

export const createCampaignHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
       
        const campaign = await saveCampaign(req.body);

        res.status(200).json({
            result: true,
            campaign: campaign
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to create campaign'
        });
    }
}

export const getCampaignListHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const search = req.query.search as string;

        if (page < 1 || limit < 1) {
            res.status(400).json({
                result: false,
                error: 'Page and limit must be greater than 0'
            });
            return;
        }

        const result = await findCampaignList(page, limit, search);

        res.status(200).json({
            result: true,
            campaigns: result.campaigns,
            pagination: result.pagination
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to get campaign list'
        });
    }
}

export const updateCampaignHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const campaignId = Number(req.params.campaignId);

        if (isNaN(campaignId)) {
            res.status(400).json({
                result: false,
                error: 'Invalid campaign ID'
            });
            return;
        }

        await updateCampaign(campaignId, req.body);

        res.status(200).json({
            result: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to update campaign'
        });
    }
}

export const deleteCampaignHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const campaignId = Number(req.params.campaignId);

        if (isNaN(campaignId)) {
            res.status(400).json({
                result: false,
                error: 'Invalid campaign ID'
            });
            return;
        }

        await deleteCampaign(campaignId);

        res.status(200).json({
            result: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to delete campaign'
        });
    }
}


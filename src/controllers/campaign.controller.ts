import { Request, Response } from 'express';
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY;

import { fillTweetListHandler } from './post.controller';
import { createCampaign, getCampaignList } from '../services/campaign.service';
import superfluidService from '../utils/superfluid';

export const createCampaignHandler = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token!, secretKey);

        const newCampaign = await createCampaign({
            name: req.body.name,
            start_date: req.body.startDate,
            end_date: req.body.endDate,
            hashtags: req.body.hashtags,
            tickers: req.body.tickers,
            handles: req.body.handles,
            reward_pool: req.body.rewardPool,
            big_accounts: req.body.bigAccounts,
            user: { id: decoded.id }
        });

        fillTweetListHandler(newCampaign.hashtags, newCampaign.tickers, newCampaign.handles, decoded.id, newCampaign.id);
        superfluidService.createStream(newCampaign.reward_pool, 0.01);

        res.status(200).json({
            result: true,
            newCampaign: newCampaign
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}

export const getCampaignListHandler = async (_req: Request, res: Response) => {
    try {
        const campaignList = await getCampaignList();

        res.status(200).json({
            result: true,
            campaignList: campaignList
        })
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}

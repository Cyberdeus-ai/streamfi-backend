import { Request, Response } from 'express';
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");

dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY;

import { fillTweetListHandler } from './post.controller';
import { createCampaign, getCampaignList } from '../services/campaign.service';


export const createCampaignHandler = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token!, secretKey);
        
        const newCampaign = await createCampaign({
            start_date: req.body.startDate,
            end_date: req.body.endDate,
            hashtags: req.body.hashtags,
            tickers: req.body.tickers,
            handles: req.body.handles,
            reward_pool: req.body.rewardPool,
            big_accounts: req.body.bigAccounts,
            user: decoded.id
        });

        const hashtags = newCampaign.hashtags.map((hashtag: any) => `%23${hashtag}`).join('%20');
        const tickers = newCampaign.tickers.map((ticker: any) => `%24${ticker}`).join("%20");
        const handles = newCampaign.handles.map((handle:any) => `%40${handle}`).join('%20');

        fillTweetListHandler(hashtags+'%20'+tickers+'%20'+handles, decoded.id, newCampaign.id);
        
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
        console.log(err);
        res.status(500).send(err);
    }
}
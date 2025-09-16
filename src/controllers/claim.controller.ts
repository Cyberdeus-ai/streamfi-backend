import { Request, Response } from "express";
const jwt = require("jsonwebtoken");
import { findUserList } from "../services/user.service";
import { findCampaignListByUser } from "../services/campaign.service";
import superfluidService from "../utils/superfluid";
import { superTokenAddress } from "../utils/constants";

require('dotenv').config();

export const getCampaignListByUserHandler = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const campaignList = await findCampaignListByUser(decoded.id);

        const balanceList = await Promise.all(campaignList.map(async (campaign: any) => {
            return await superfluidService.checkPoolBalance(campaign.reward_pool, superTokenAddress);
        }));

        const rewardList = campaignList.map((campaign: any, index: number) => {
            return {
                ...campaign,
                balance: balanceList[index]
            };
        });

        res.status(200).json({
            result: true,
            rewardList
        });
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const getUserListHandler = async () => {
    try {
        const userList = await findUserList();
        return userList;
    } catch (err) {
        console.error(err);
        return null;
    }
}

import { Request, Response } from "express";
const jwt = require("jsonwebtoken");
import { findUserList } from "../services/user.service";
import { findCampaignListByUser } from "../services/campaign.service";

require('dotenv').config();

export const getCampaignListByUserHandler = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        const campaignList = await findCampaignListByUser(decoded.id);
        
        res.status(200).json({
            result: true,
            campaignList
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
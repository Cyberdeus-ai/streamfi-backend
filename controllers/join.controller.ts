import { Request, Response, NextFunction } from "express";

import { saveJoin } from "../services/join.service";
import { findProfileByCondition } from "../services/xaccount.service";

export const saveJoinHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const userId = parseInt(req.body.userId);
        const campaignId = parseInt(req.body.campaignId);
        const twitterReferer = req.body.twitterReferer;

        const referer = await findProfileByCondition({
            where: {
                username: twitterReferer
            }
        });

        if (!referer) {
            await saveJoin({
                promoter: { id: userId },
                campaign: { id: campaignId }
            });
        } else {
            await saveJoin({
                promoter: { id: userId },
                campaign: { id: campaignId },
                referer: { id: referer.user.id }
            });
        }

        res.status(200).json({ result: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ result: false, error: 'Failed to save join' });
    }
}
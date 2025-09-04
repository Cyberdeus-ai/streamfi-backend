import { Request, Response } from "express";
import { findScoreList, findScoreListByCondition, insertScoreList } from '../services/score.service';
import { findEngagerList, findUserByCondition, findUserList } from "../services/user.service";
import scoreConfig from "../utils/score-settings";
import { findPostListByCampaign } from "../services/post.service";
import { Between } from "typeorm";

export const getScoreListHandler = async () => {
    try {
        const scoreList = await findScoreList();
        return scoreList;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const getScoreListByCampaignHandler = async (req: Request, res: Response) => {
    try {
        const postList = await findPostListByCampaign(req.body.campaignId);
        let fromDate = new Date();
        switch (req.body.period) {
            case 0:
                fromDate.setHours(fromDate.getHours() - 24);
                break;
            case 1:
                fromDate.setHours(fromDate.getHours() - 48);
                break;
            case 2:
                fromDate.setDate(fromDate.getDate() - 7);
                break;
            case 3:
                fromDate.setDate(fromDate.getDate() - 30);
                break;
            case 4:
                fromDate.setMonth(fromDate.getMonth() - 3);
                break;
            case 5:
                fromDate.setMonth(fromDate.getMonth() - 6);
                break;
            case 6:
                fromDate.setFullYear(fromDate.getFullYear() - 1);
                break;
            default:
                break;
        }
        const scoreData = await findScoreListByCondition({
            post: {
                id: [
                    ...postList.map((post: any) => {
                        return post.id;
                    }),
                    null
                ]
            },
            created_at: Between(fromDate, new Date()),
        });
        const userList = await findUserList();
        const scoreList = userList.map((score: any) => {
            return {
                ...score,
                user: {
                    ...score.user,
                    username: userList.find((user: any) => user.id === score.user.id).xaccount.username
                }
            }
        })

        res.status(200).json({
            result: true,
            scoreList
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
}

export const setScoreByAccountHandler = async () => {
    try {
        const engagerList = await findEngagerList();

        const filtered = engagerList.map((user: any) => {
            let score: number = 0;
            let profile = user.xaccount;

            if (profile.is_blue_verified || profile.is_verified) {
                score += scoreConfig.verification;
            }

            score += profile.follower_count / 1000000 * scoreConfig.bigAccounts;

            score += (new Date().getTime() - new Date(profile.created_at).getTime()) / 1000 / 3600 / 8760 * scoreConfig.accountAge;

            return {
                user: { id: user.id },
                score: Math.ceil(score),
            }
        });

        await insertScoreList(filtered);
    } catch (err) {
        console.error(err);
        return null;
    }
}
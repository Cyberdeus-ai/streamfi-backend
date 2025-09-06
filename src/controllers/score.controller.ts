import { Request, Response } from "express";
import {
    findScoreList,
    findScoreListByCondition,
    findScoreUserList,
    findGainScoreList,
    findFirstScoreList,
    insertScoreList
} from '../services/score.service';
import { findEngagerList } from "../services/user.service";
import { findPostUserListByCampaign } from "../services/post.service";
import scoreConfig from "../utils/score-settings";

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
        const postUserList = await findPostUserListByCampaign(req.body.campaignId);
        let fromDate = new Date();
        switch (req.body.period) {
            case 0:
                fromDate.setDate(fromDate.getDate() - 7);
                break;
            case 1:
                fromDate.setDate(fromDate.getDate() - 30);
                break;
            case 2:
                fromDate.setMonth(fromDate.getMonth() - 3);
                break;
            case 3:
                fromDate.setMonth(fromDate.getMonth() - 6);
                break;
            case 4:
                fromDate.setFullYear(fromDate.getFullYear() - 1);
                break;
            default:
                break;
        }
        const scoreList = await findScoreListByCondition(postUserList, fromDate);
        const userList = await findScoreUserList(postUserList);
        const top20UserList = userList.slice(0, 20);
        const top20ScoreList = top20UserList.map((user: any) => {
            let userScoreList = scoreList.filter((score: any) => score.user_id === user.user_id);
            if (userScoreList) {
                userScoreList.sort((a: any, b: any) => new Date(a.score_created_at).getTime() - new Date(b.score_created_at).getTime())
            }
            return {
                ...user,
                score: userScoreList
            }
        });

        res.status(200).json({
            result: true,
            top20ScoreList,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
}

export const getGainScoreListByCampaignHandler = async (req: Request, res: Response) => {
    try {
        const postUserList = await findPostUserListByCampaign(req.body.campaignId);
        const userList = await findGainScoreList(postUserList);
        const firstScoreList = await findFirstScoreList();

        let gainUserList = userList.map((user: any) => {
            const userFirstScore = firstScoreList.find((score: any) => score.user.id === user.user_id);
            return {
                ...user,
                gain: Number(user.current) - Number(userFirstScore.percentage),
            }
        });

        gainUserList.sort((a: any, b: any) => b.gain - a.gain);

        const len = gainUserList.length;
        
        let gainerList = gainUserList.slice(0, 10);
        let loserList = gainUserList.slice(len-10);

        res.status(200).json({
            result: true,
            gainerList,
            loserList,
            userList
        });
    } catch (err) {
        console.error(err);
        return res.status(500).send(err);
    }
}

export const setScoreByAccountHandler = async () => {
    try {
        const engagerList = await findEngagerList();

        let scoreList = engagerList.map((user: any) => {
            let score: number = 0;
            let profile = user.xaccount;

            if (profile.is_blue_verified || profile.is_verified) {
                score += scoreConfig.verification;
            }

            score += profile.follower_count / 1000000 * scoreConfig.bigAccounts;

            score += (new Date().getTime() - new Date(profile.created_at).getTime()) / 1000 / 3600 / 8760 * scoreConfig.accountAge;

            return {
                user: { id: user.id },
                value: Math.ceil(score),
            }
        });

        const total = scoreList.reduce((total: number, score: any) => total + score.value, 0);
        scoreList = scoreList.map((score: any) => {
            return {
                ...score,
                percentage: Math.round(score.value / total * 10000)
            }
        })

        await insertScoreList(scoreList);
    } catch (err) {
        console.error(err);
        return null;
    }
}
import { Request, Response } from "express";
import {
    insertScoreList,
    findUserScoreList,
    findLatestScore,
    findLatestScoreList
} from '../services/score.service';
import { findGainScoreList, findFirstScoreList, findScoreListByCondition } from "../services/relative.service";
import { insertRelativeList } from "../services/relative.service";
import { findEngagerList } from "../services/user.service";
import { findPostList } from "../services/post.service";
import scoreConfig from "../utils/score-settings";

type EngageType = keyof typeof scoreConfig.engage;

export const getScoreListByCampaignHandler = async (req: Request, res: Response) => {
    try {
        let top20ScoreList = [];
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

        top20ScoreList = await findScoreListByCondition(fromDate, req.body.campaignId);
        console.log(top20ScoreList);

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
        let userList = [];
        let gainerList = [];
        let loserList = [];

        userList = await findGainScoreList(req.body.campaignId);
        const firstScoreList = await findFirstScoreList(req.body.campaignId);

        const gainUserList = userList.map((user: any) => {
            const userFirstScore = firstScoreList.find((score: any) => score.user_id === user.user_id);
            return {
                ...user,
                percentage: user.current,
                gain: Number(user.current) - Number(userFirstScore.value),
                oneweek: user.oneweek ?  Number(user.current) - Number(user.oneweek) : 0,
                onemonth: user.onemonth ? Number(user.current) - Number(user.onemonth) : 0,
                threemonths: user.threemonths ? Number(user.current) - Number(user.threemonths) : 0,
                sixmonths: user.sixmonths ? Number(user.current) - Number(user.sixmonths) : 0,
                oneyear: user.oneyear ? Number(user.current) - Number(user.oneyear) : 0
            }
        });

        gainUserList.sort((a: any, b: any) => b.gain - a.gain);

        gainerList = gainUserList.slice(0, 10);
        loserList = gainUserList.slice(-10).reverse();

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

        await insertScoreList(scoreList);
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const setScoreByPostTypeHandler = async (postList: any[], type: EngageType) => {
    try {
        let scoreList: any[] = [];
        postList.forEach((post: any) => {
            const index = scoreList.findIndex((score: any) => score.user.id === post.user.id);
            if (index > -1) {
                scoreList[index].value += Number(scoreConfig.engage[type]);
            } else {
                scoreList.push({
                    user: { id: post.user.id },
                    value: Number(scoreConfig.engage[type]),
                    campaign: { id: post.campaign.id }
                });
            }
        });

        const oldScoreList = await Promise.all(scoreList.map(async (score: any) => {
            return await findLatestScore(score.campaign.id, score.user.id);
        }));

        const userScoreList = await findUserScoreList();
        scoreList = oldScoreList.map(async (oldScore: any, index: number) => {
            if (oldScore && oldScore.length > 0 && oldScore[0]) {
                return {
                    ...scoreList[index],
                    value: oldScore[0].value + scoreList[index].value
                }
            }
            const value = userScoreList.find((userScore: any) => userScore.user.id === scoreList[index].user.id)?.value + scoreList[index].value;
            return {
                ...scoreList[index],
                value: value
            }
        });

        await insertScoreList(scoreList);
        await setRelativeHandler();
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const setScoreByPostHandler = async () => {
    try {
        const postList = await findPostList();
        const userScoreList = await findUserScoreList();
        for (let i = 0; i < postList.length; i++) {
            let scoreList: any[] = [];

            postList[i].list.forEach((post: any) => {
                const index = scoreList.findIndex((score: any) => score.user.id === post.user_id);
                if (index > -1) {
                    scoreList[index].value += Number(scoreConfig.engage[post.type as EngageType]);
                } else {
                    scoreList.push({
                        user: { id: post.user_id },
                        value: Number(scoreConfig.engage[postList[i].type as EngageType]),
                        campaign: { id: postList[i].campaign_id }
                    });
                }
            });

            const oldScoreList = await Promise.all(scoreList.map(async (score: any) => {
                return await findLatestScore(score.campaign.id, score.user.id);
            }));

            scoreList = oldScoreList.map((oldScore: any, index: number) => {
                if (oldScore && oldScore.length > 0 && oldScore[0]) {
                    return {
                        ...scoreList[index],
                        value: oldScore[0].value + scoreList[index].value
                    }
                }
                const value = userScoreList.find((userScore: any) => userScore.user.id === scoreList[index].user.id)?.value + scoreList[index].value;
                return {
                    ...scoreList[index],
                    value: value
                }
            });

            await insertScoreList(scoreList);
            await setRelativeHandler();
        }

    } catch (err) {
        console.error(err);
        return null;
    }
}

const setRelativeHandler = async () => {
    try {
        const campaignList = await findLatestScoreList();

        const relatives = campaignList.flatMap((campaign: any) => {
            const total = campaign.scorelist?.reduce((total: number, current: any) => total + Number(current.value), 0);
            const rlt = campaign.scorelist?.map((score: any) => ({ campaign: { id: campaign.campaign_id }, value: Number((Number(score.value) / total * 100).toFixed(2)), user: { id: score.user_id } }))
            return rlt;
        });

        insertRelativeList(relatives);
    } catch (err) {
        console.error(err);
        return null;
    }
}
import moment from "moment";
import { findScoreList, saveScore, findScoreByCondition, updateScore } from '../services/score.service';
import { findEngagerList } from "../services/user.service";
import scoreConfig from "../config/score.config";
import { findPostList } from "../services/post.service";

export const getScoreListHandler = async () => {
    try {
        const scoreList = await findScoreList();
        return scoreList;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const setScoreByAccountHandler = async () => {
    try {
        const engagerList = await findEngagerList();

        Promise.all([
            engagerList.map(async (user: any) => {
                let score: number = 0;
                let profile = user.xaccount;

                if (profile.is_blue_verified || profile.is_verified) {
                    score += scoreConfig.verification;
                }

                score += profile.follower_count / 100000 * scoreConfig.bigAccounts;

                score += (new Date().getTime() - new Date(profile.created_at).getTime()) / 1000 / 3600 / 8760 * scoreConfig.accountAge;
                
                return await updateScore(user.id, score);
            })
        ]);
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const setScoreByPostHandler = async () => {
    try {
        const postList = await findPostList();

        Promise.all([
            postList.map(async (post: any) => {
                let score: number = 0;

                switch (post.type) {
                    case "quote":
                        score = scoreConfig.engage.quote;
                        break;
                    case "reply":
                        score = scoreConfig.engage.reply;
                        break;
                    case "retweet":
                        score = scoreConfig.engage.retweet;
                        break;
                    default:
                        break;
                }
                await saveScore(post.user.id, score, post.id);
            })
        ])
    } catch (err) {
        console.error(err);
        return null;
    }
}
import moment from "moment";
import { findScoreList, saveScore, findScoreByCondition, updateScore } from '../services/score.service';
import scoreConfig from "../config/score.config";

export const getScoreListHandler = async () => {
    try {
        const scoreList = await findScoreList();
        return scoreList;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const setScoreByAccountHandler = async (userId: number, profile: any) => {
    try {
        let result: number = 0;

        if(profile.is_blue_verified || profile.is_verified) {
            result += scoreConfig.verification;
        }

        result += profile.follower_count / 100000 * scoreConfig.bigAccounts;
        
        result += (new Date().getTime() - new Date(profile.created_at).getTime()) / 1000 / 3600 / 86400 * scoreConfig.accountAge;

        const exist = await findScoreByCondition({
            user: userId,
            post: null
        });
        
        if(exist) await saveScore(userId, result);
        else await updateScore(userId, result);
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const setScoreByPostHandler = async (engageType: keyof typeof scoreConfig.engage, userId: number, postId: number) => {
    try {
        let result: number = 0;
        
        result += scoreConfig.engage[engageType];

        await saveScore(userId, result, postId);
    } catch (err) {
        console.error(err);
        return null;
    }
}
import { AppDataSource } from "../utils/data-source";
import { Score } from "../entities";

const scoreRepo = AppDataSource.getRepository(Score);

export const findScoreList = async () => {
    let result: any = null;

    result = await scoreRepo.find();

    return result;
};

export const findScoreByCondition = async (condition: object) => {
    let result: any = null;

    result = await scoreRepo.findOneBy(condition);

    return result;
}

export const saveScore = async (userId: number, score: number, postId?: number) => {
    let result: any = null;

    const scoreData: any = {
        user: { id: userId },
        score: score,
    };

    if (postId !== undefined) {
        scoreData.post = { id: postId };
    }

    result = await scoreRepo.save(scoreData);

    return result;
}

export const updateScore = async (userId: number, score: number, postId?: number) => {
    let result: any = null;

    const whereCondition: any = {
        user: { id: userId }
    };

    if (postId !== undefined) {
        whereCondition.post = { id: postId };
    }

    result = await scoreRepo.update(
        whereCondition,
        { score: score }
    );

    return result;
}
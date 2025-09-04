import { AppDataSource } from "../utils/data-source";
import { Score } from "../entities";

const scoreRepo = AppDataSource.getRepository(Score);

export const findScoreList = async () => {
    let result: any = null;

    result = await scoreRepo.find({
        relations: ["user", "post"]
    });

    return result;
};

export const findLatestScoreList = async () => {
    let result: any = null;

    result = await scoreRepo.find({
        where: {
            is_latest: true
        },
        relations: ["user"]    
    });

    return result;
}

export const findScoreListByCondition = async (condition: any) => {
    let result: any = null;

    result = await scoreRepo.find({
        where: condition,
        relations: ['user', 'post']
    });

    return result;
}

export const saveScore = async (userId: number, score: number): Promise<any> => {
    let result: any = null;

    const scoreData: any = {
        user: { id: userId },
        score: score,
    };

    result = await scoreRepo.save(scoreData);

    return result;
}

export const insertScoreList = async (input: any) => {
    let result: any = null;

    result = await scoreRepo.insert(input);

    return result;
}

export const updateIsLatest = async () => {
    let result: any = null;

    result = await scoreRepo.update(
        {is_latest: true},
        {is_latest: false}
    );

    return result;
}
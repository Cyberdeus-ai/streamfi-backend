import { AppDataSource } from "../utils/data-source";
import { Pool } from "../entities";

const poolRepo = AppDataSource.getRepository(Pool);

export const insertPoolList = async (input: any) => {
    let result: any = null;

    result = await poolRepo.insert(input);

    return result;
}

export const findPoolByCondition = async (campaignId: number, userId: number) => {
    let result: any = null;

    result = await poolRepo.findOneBy({
        campaign: {
            id: campaignId
        },
        user: {
            id: userId
        }
    });

    return result;

}
import { DeepPartial } from 'typeorm';
import { AppDataSource } from '../utils/data-source';
import { Activity } from '../entities';

const activityRepo = AppDataSource.getRepository(Activity);

export const saveActivity = async (input: DeepPartial<Activity>): Promise<any> => {
    let result: any = null;

    result = await activityRepo.save(input);

    return result;
}

export const findRecentActivityByUserId = async (userId: number): Promise<any> => {
    let result: any = null;

    result = await activityRepo.find({
        where: {
            user: { id: userId }
        },
        relations: ["campaign"],
        order: {
            created_at: 'DESC'
        },
        take: 5
    });

    return result;
}
import { DeepPartial, In } from 'typeorm';
import { AppDataSource } from '../utils/data-source';
import { Join } from '../entities';

const joinRepo = AppDataSource.getRepository(Join);

export const saveJoin = async (input: DeepPartial<Join>): Promise<any> => {
    let result: any = null;

    result = await joinRepo.save(input);

    return result;
}

export const findJoinListByCampaignId = async (campaignId: number): Promise<any> => {
    let result: any = null;

    result = await joinRepo.find({
        where: {
            campaign: { id: campaignId }
        }
    });

    return result;
}

export const findUserListByCampaignList = async (campaignIdList: number[]): Promise<any> => {
    let result: any = null;

    result = await joinRepo.find({
        where: {
            campaign: { id: In(campaignIdList) }
        }
    });

    return result;
}

export const findJoinListByUserId = async (userId: number): Promise<any> => {
    let result: any = null;

    result = await joinRepo.find({
        where: {
            promoter: { id: userId }
        },
        relations: ['campaign']
    });

    return result;
}


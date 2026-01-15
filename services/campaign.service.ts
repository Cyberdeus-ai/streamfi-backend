import { DeepPartial, ILike, LessThan, MoreThan, Or } from 'typeorm';
import { AppDataSource } from '../utils/data-source';
import { Campaign } from '../entities';

const campaignRepo = AppDataSource.getRepository(Campaign);

export const saveCampaign = async (input: DeepPartial<Campaign>): Promise<any> => {
    let result: any = null;

    result = await campaignRepo.save(input);

    return result;
}

export const findCampaignList = async (page: number = 1, limit: number = 10, search?: string): Promise<any> => {
    let result: any = null;

    const skip = (page - 1) * limit;

    let whereCondition: any = undefined;

    if (search && search.trim()) {
        const searchPattern = `%${search.trim()}%`;
        whereCondition = [
            { name: ILike(searchPattern) },
            { description: ILike(searchPattern) },
            { website: ILike(searchPattern) },
            { twitter: ILike(searchPattern) },
            { about: ILike(searchPattern) }
        ];
    }

    const [campaigns, total] = await campaignRepo.findAndCount({
        where: whereCondition,
        relations: ['pool'],
        skip: skip,
        take: limit,
        order: {
            id: 'DESC'
        }
    });

    result = {
        campaigns,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };

    return result;
}

export const findTotalCampaignListByUserId = async (userId: number): Promise<any> => {
    let result: any = null;

    result = await campaignRepo.find({
        where: {
            user: { id: userId }
        }
    });

    return result;
}

export const findActiveCampaignListByAdmin = async (userId: number): Promise<any> => {
    let result: any = null;

    result = await campaignRepo.find({
        where: {
            user: { id: userId },
            start_date: LessThan(new Date(Date.now())),
            end_date: MoreThan(new Date(Date.now()))
        },
        relations: ['pool']
    });

    return result;
}

export const findTotalPromotersListByUserId = async (userId: number): Promise<any> => {
    let result: any = null;

    result = await campaignRepo.find({
        select: ['promoters', 'old_promoters'],
        where: {
            user: { id: userId }
        }
    });

    return result;
}

export const updateCampaign = async (campaignId: number, data: DeepPartial<Campaign>): Promise<any> => {
    let result: any = null;

    result = await campaignRepo.update(
        { id: campaignId } as any,
        data
    );

    return result;
}

export const deleteCampaign = async (campaignId: number): Promise<any> => {
    let result: any = null;

    result = await campaignRepo.delete({
        id: campaignId
    } as any);

    return result;
}


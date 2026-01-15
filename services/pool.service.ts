import { DeepPartial, ILike } from 'typeorm';
import { AppDataSource } from '../utils/data-source';
import { Pool } from '../entities';

const poolRepo = AppDataSource.getRepository(Pool);

export const savePool = async (input: DeepPartial<Pool>): Promise<any> => {
    let result: any = null;

    result = await poolRepo.save(input);

    return result;
}

export const findPoolListByUserId = async (userId: number): Promise<any> => {
    let result: any = null;

    result = await poolRepo.find({
        where: { user: { id: userId } },
    });

    return result;
}

export const findTotalPoolListByUserId = async (userId: number): Promise<any> => {
    let result: any = null;

    result = await poolRepo.find({
        select: ['token', 'address'],
        where: { user: { id: userId } }
    })

    return result;
}

export const findSuperToken = async (superTokenAddress: string, userId: number): Promise<any> => {
    let result: any = null;

    result = await poolRepo.findOne({
        where: {
            super_token_address: superTokenAddress,
            user: { id: userId }
        }
    });

    return result;
}

export const updatePool = async (poolId: number, flowRate: number, flowRateUnit: string): Promise<any> => {
    let result: any = null;
    
    result = await poolRepo.update(
        { id: poolId } as any,
        {
            flow_rate: flowRate,
            flow_rate_unit: flowRateUnit
        }
    );

    return result;
}


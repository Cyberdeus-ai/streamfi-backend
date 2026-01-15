import { AppDataSource } from '../utils/data-source';
import { Flowrate } from '../entities';
import { DeepPartial } from 'typeorm';

const flowrateRepo = AppDataSource.getRepository(Flowrate);

export const saveFlowrate = async (input: DeepPartial<Flowrate>): Promise<any> => {
    let result: any = null;

    result = await flowrateRepo.save(input);

    return result;
}

export const findRecentFlowrateByUserId = async (userId: number): Promise<any> => {
    let result: any = null;

    result = await flowrateRepo.find({
        where: {
            user: { id: userId }
        },
        order: {
            created_at: 'DESC'
        },
    });

    return result;
}
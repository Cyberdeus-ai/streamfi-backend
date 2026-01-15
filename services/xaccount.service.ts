import { DeepPartial } from 'typeorm';

import { AppDataSource } from '../utils/data-source';
import { XAccount } from '../entities';

const xAccountRepo = AppDataSource.getRepository(XAccount);

export const saveProfile = async (input: DeepPartial<XAccount>): Promise<any> => {
    let result: any = null;

    result = await xAccountRepo.save(input);

    return result;
}

export const findProfileByCondition = async (condition: object): Promise<any> => {
    let result: any = null;
    
    result = await xAccountRepo.findOneBy(condition);

    return result;
} 
import { DeepPartial } from 'typeorm';

import { AppDataSource } from '../utils/data-source';
import { User } from '../entities/user.entity';

const userRepo = AppDataSource.getRepository(User);

export const createUser = async (input: DeepPartial<User>): Promise<any> => {
    let result: any = null;

    result = await userRepo.save(input);

    return result;
}

export const findUserByAddress = async (address: string): Promise<any> => {
    let result: any = null;
    
    result = await userRepo.findOneBy({
        wallet_address: address
    });

    return result;
}
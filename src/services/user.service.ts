import { DeepPartial, Not } from 'typeorm';

import { AppDataSource } from '../utils/data-source';
import { User } from '../entities';

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

export const findUserByTwitterAccount = async (twitterAccount: string): Promise<any> => {
    let result: any = null;

    result = await userRepo.findOneBy({
        twitter_account: twitterAccount
    });

    return result;
}

export const findEngagerList = async (): Promise<any> => {
    let result: any = null;

    result = await userRepo.findBy({
        account_type: Not("Admin")
    });

    return result;
}

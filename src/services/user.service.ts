import { DeepPartial, Not } from 'typeorm';

import { AppDataSource } from '../utils/data-source';
import { User } from '../entities';

const userRepo = AppDataSource.getRepository(User);

export const saveUser = async (input: DeepPartial<User>): Promise<any> => {
    let result: any = null;

    result = await userRepo.save(input);

    return result;
}

export const findUserByCondition = async (condition: any): Promise<any> => {
    let result: any = null;

    result = await userRepo.findOneBy(condition);

    return result;
}

export const findEngagerList = async (): Promise<any> => {
    let result: any = null;

    result = await userRepo.findBy({
        account_type: Not("Admin")
    });

    return result;
}

export const updateUser = async (userId: number, accountType: string): Promise<any> => {
    let result: any = null;

    result = await userRepo.update(
        { id: userId },
        { account_type: accountType }
    );

    return result;
 }

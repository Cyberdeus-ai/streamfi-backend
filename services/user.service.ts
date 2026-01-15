import { DeepPartial, Not, In } from 'typeorm';
import { AppDataSource } from '../utils/data-source';
import { User } from '../entities';

const userRepo = AppDataSource.getRepository(User);

export const saveUser = async (input: DeepPartial<User>): Promise<any> => {
    let result: any = null;

    result = await userRepo.save(input);

    return result;
}

export const findUserList = async () => {
    let result: any = null;

    result = await userRepo.find({
        relations: ['xaccount']
    });

    return result;
}

export const findUserByCondition = async (condition: any): Promise<any> => {
    let result: any = null;

    result = await userRepo.findOneBy(condition);

    return result;
}

export const findPromoterList = async (): Promise<any> => {
    let result: any = null;

    result = await userRepo.find({
        where: { account_type: Not("Admin") },
        relations: ["xaccount"],
        order: {
            id: "ASC"
        }
    });

    return result;
}

export const findPromoterListByCampaign = async (condition: any[]) => {
    let result: any = null;

    result = await userRepo.find({
        where: { 
            account_type: Not("Admin"),
            id: In(condition) 
        },
        relations: ["xaccount"]
    });

    return result;    
}

export const findTopPromoterList = async () => {
    let result: any = null;

    result = await userRepo.find({
        where: { account_type: Not("Admin") },
        relations: ["xaccount"],
        take: 5
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

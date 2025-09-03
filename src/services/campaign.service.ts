import { DeepPartial } from "typeorm";

import { AppDataSource } from "../utils/data-source";
import { Campaign } from "../entities";

const campaignRepo = AppDataSource.getRepository(Campaign);

export const createCampaign = async(input: DeepPartial<Campaign>): Promise<any> => {
    let result: any = null;

    result = await campaignRepo.save(input);

    return result;
}

export const getCampaignList = async() => {
    let result: any[] = [];

    result =  await campaignRepo.find({
        relations: ['user']
    });

    return result;
}
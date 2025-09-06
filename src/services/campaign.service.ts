import { DeepPartial } from "typeorm";

import { AppDataSource } from "../utils/data-source";
import { Campaign, Post } from "../entities";

const campaignRepo = AppDataSource.getRepository(Campaign);
const postRepo = AppDataSource.getRepository(Post);

export const createCampaign = async (input: DeepPartial<Campaign>): Promise<any> => {
    let result: any = null;

    result = await campaignRepo.save(input);

    return result;
}

export const getCampaignList = async () => {
    let result: any[] = [];

    const query = await postRepo.createQueryBuilder("pt")
        .select("campaign.id", "id")
        .addSelect("campaign.start_date", "start_date")
        .addSelect("campaign.end_date", "end_date")
        .addSelect("campaign.reward_pool", "reward_pool")
        .addSelect("campaign.hashtags", "hashtags")
        .addSelect("campaign.tickers", "tickers")
        .addSelect("campaign.handles", "handles")
        .addSelect("campaign.user_id", "user_id")
        .addSelect("campaign.created_at", "created_at")
        .addSelect("campaign.updated_at", "updated_at")
        .addSelect("COUNT(CASE WHEN pt.type = 'tweet' THEN 1 END)", "tweet")
        .addSelect("COUNT(CASE WHEN pt.type = 'quote' THEN 1 END)", "quote")
        .addSelect("COUNT(CASE WHEN pt.type = 'reply' THEN 1 END)", "reply")
        .addSelect("COUNT(CASE WHEN pt.type = 'retweet' THEN 1 END)", "retweet")
        .innerJoin("pt.campaign", "campaign") 
        .groupBy("campaign.id")

    result = await query.getRawMany();
    return result;
}

export const findCampaignDetail = async (id: number): Promise<any> => {
    let result: any = null;

    result = await campaignRepo.find({
        where: {
            id: id
        },
        relations: ['user', 'posts']
    });

    return result;
}

export const findCampaignCountByUser = async (userId: number) => {
    let result: any = null;

    result = await campaignRepo.count({
        where: {
            user: {
                id: userId
            }
        }
    });

    return result;
}
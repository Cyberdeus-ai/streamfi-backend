import { DeepPartial, In } from "typeorm";

import { AppDataSource } from "../utils/data-source";
import { Campaign, Post, XAccount } from "../entities";

const campaignRepo = AppDataSource.getRepository(Campaign);

export const createCampaign = async (input: DeepPartial<Campaign>): Promise<any> => {
    let result: any = null;

    const newCampaign = await campaignRepo.save(input);

    result = await campaignRepo
        .createQueryBuilder("camp")
        .select("camp.id", "id")
        .addSelect("camp.name", "name")
        .addSelect("camp.start_date", "start_date")
        .addSelect("camp.end_date", "end_date")
        .addSelect("camp.reward_pool", "reward_pool")
        .addSelect("camp.hashtags", "hashtags")
        .addSelect("camp.tickers", "tickers")
        .addSelect("camp.handles", "handles")
        .addSelect("camp.user_id", "user_id")
        .addSelect("camp.created_at", "created_at")
        .addSelect("camp.updated_at", "updated_at")
        .addSelect("xa.name", "xa_name")
        .addSelect("xa.username", "xa_username")
        .leftJoin(XAccount, "xa", "xa.user_id = camp.user_id")
        .where('camp.id = :campaignId', { campaignId: newCampaign.id })
        .groupBy("camp.id, xa.username, xa.name")
        .orderBy("camp.created_at", "DESC")
        .getRawOne();

    return {
        ...result,
        tweet: 0,
        quote: 0,
        reply: 0,
        retweet: 0
    };
}

export const getCampaignList = async () => {
    let result: any[] = [];

    result = await campaignRepo
        .createQueryBuilder("camp")
        .select("camp.id", "id")
        .addSelect("camp.name", "name")
        .addSelect("camp.start_date", "start_date")
        .addSelect("camp.end_date", "end_date")
        .addSelect("camp.reward_pool", "reward_pool")
        .addSelect("camp.hashtags", "hashtags")
        .addSelect("camp.tickers", "tickers")
        .addSelect("camp.handles", "handles")
        .addSelect("camp.user_id", "user_id")
        .addSelect("camp.created_at", "created_at")
        .addSelect("camp.updated_at", "updated_at")
        .addSelect("COUNT(CASE WHEN pt.type = 'tweet' THEN 1 END)", "tweet")
        .addSelect("COUNT(CASE WHEN pt.type = 'quote' THEN 1 END)", "quote")
        .addSelect("COUNT(CASE WHEN pt.type = 'reply' THEN 1 END)", "reply")
        .addSelect("COUNT(CASE WHEN pt.type = 'retweet' THEN 1 END)", "retweet")
        .addSelect("xa.name", "xa_name")
        .addSelect("xa.username", "xa_username")
        .leftJoin(Post, "pt", "pt.campaign_id = camp.id")
        .leftJoin(XAccount, "xa", "xa.user_id = camp.user_id")
        .groupBy("camp.id, xa.username, xa.name")
        .orderBy("camp.created_at", "DESC")
        .getRawMany();

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

export const findCampaignListByUser = async (userId: number) => {
    let result: any = null;

    result = await campaignRepo.query(`
            select post.user_id, campaign.*
            from post
            inner join campaign on campaign.id = post.campaign_id
            where post.user_id = $1
            and post.type != 'tweet'
            group by post.user_id, campaign.id;
        `, [userId]);

    return result;
}
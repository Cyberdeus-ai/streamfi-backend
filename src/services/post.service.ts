import { DeepPartial, Not } from "typeorm";
import moment from "moment";
import { AppDataSource } from "../utils/data-source";
import { Post, Continuation } from "../entities";

const postRepo = AppDataSource.getRepository(Post);
const contRepo = AppDataSource.getRepository(Continuation);

export const insertPostList = async (postData: DeepPartial<Post>[]) => {
	let result: any = null;

	result = await postRepo.insert(postData);

	return result;
};

export const savePost = async (post: DeepPartial<Post>) => {
	let result: any = null;

	result = await postRepo.save(post);

	return result;
}

export const findPostList = async () => {
	let result: any = null;

	result = await postRepo.query(`
		SELECT
			pt.campaign_id,
			pt.type,
			jsonb_agg(
				jsonb_build_object(
					'id', pt.id,
					'user_id', pt.user_id
				)
				ORDER BY pt.id ASC
			) AS list
		FROM post pt
		WHERE pt.type != 'tweet'
		GROUP BY pt.campaign_id, pt.type;`)

	return result;
}

export const findCampaignByPost = async (postId: number) => {
	let result: any = null;

	result = await postRepo.find({
		where: {
			id: postId
		},
		relations: ['campaign']
	});

	return result;
}

export const findPostUserListByCampaign = async (campaignId: number) => {
	let result: any = null;

	result = await postRepo
		.createQueryBuilder('post')
		.innerJoin('post.user', 'user')
		.innerJoin('post.campaign', 'campaign')
		.where('campaign.id = :campaignId', { campaignId })
		.andWhere('post.type != :type', { type: 'tweet' })
		.groupBy('user.id')
		.select('user.id', 'id')
		.getRawMany();

	return result;
}

export const findTweetList = async () => {
	let result: any = null;

	result = await postRepo
		.createQueryBuilder('post')
		.innerJoin('post.campaign', 'campaign')
		.leftJoin('continuation', 'cont', 'post.id = cont.post_id')
		.select(['post.id as id', 'post.tweet_id as tweet_id', 'campaign.id as campaign_id', 'cont.quote_id as quote_id', 'cont.reply_id as reply_id', 'cont.retweet_id as retweet_id'])
		.where('post.type = :type', { type: 'tweet' })
		.groupBy('post.id, campaign.id, cont.id')
		.getRawMany();

	return result;
}

export const findPostByCondition = async (campaignId: number, userId: number) => {
    let result: any = null;

    result = await postRepo.findOne({
        where: {
            campaign: { id: campaignId },
            user: {
                id: userId
            }
        },
        relations: ["user", "campaign"]
    });

    return result;
}
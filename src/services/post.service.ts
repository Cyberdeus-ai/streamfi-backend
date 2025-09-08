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

	result = await postRepo.find({
		relations: ['campaign', 'user', 'continuation']
	});

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

	result = await contRepo.find({
		relations: ['post']
	});

	return result;
}

export const updatePost = async (post: any) => {
	let result: any = null;

	result = await postRepo.update(
		{
			id: post.id
		},
		{
			tweet_id: post.tweet_id,
			type: post.type,
			user: post.userId,
			campaign: post.campaignId,
			timestamp: moment(post.timestamp * 1000)
		}
	)

	return result;
}
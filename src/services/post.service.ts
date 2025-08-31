import { DeepPartial } from "typeorm";

import { AppDataSource } from "../utils/data-source";
import { Post } from "../entities";

const postRepo = AppDataSource.getRepository(Post);

export const insertPostList = async (postData: DeepPartial<Post>[]) => {
	let result:any = null;

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

	result = await postRepo.find();

	return result;
}

export const findTweetList = async ():Promise<any[]>=>{
	let result:any=null;
    
    result = await postRepo.find({
		where:{
			type:'tweet'
		}
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
            tweet_account: post.username,
            user: post.userId,
            campaign: post.campaignId,
            timestamp: new Date(post.timestamp * 1000)
		}
	)

	return result;
}
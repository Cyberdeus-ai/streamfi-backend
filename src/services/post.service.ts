import { DeepPartial } from "typeorm";

import { AppDataSource } from "../utils/data-source";
import { Post } from "../entities";

const postRepo = AppDataSource.getRepository(Post);

export const createPostList = async (postData: DeepPartial<Post>[]) => {
	let result:any = null;

    result = await postRepo.insert(postData);
	
    return result;
};

export const findTweetList = async ():Promise<any[]>=>{
	let result:any=null;
    
    result = await postRepo.find({
		where:{
			type:'tweet'
		}
	});

	return result;
}
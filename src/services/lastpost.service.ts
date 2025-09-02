import { DeepPartial } from "typeorm";
import { AppDataSource } from "../utils/data-source";
import { LastPost } from "../entities";

const postRepo = AppDataSource.getRepository(LastPost);

export const insertLastPostList = async (lastPostData: DeepPartial<LastPost>[]) => {
    let result:any = null;

    result = await postRepo.insert(lastPostData);
    
    return result;
};

export const saveLastPost = async (lastPost: DeepPartial<LastPost>) => {
    let result: any = null;

    result = await postRepo.save(lastPost);

    return result;
}
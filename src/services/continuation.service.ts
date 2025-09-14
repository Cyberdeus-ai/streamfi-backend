import { DeepPartial } from "typeorm";
import { AppDataSource } from "../utils/data-source";
import { Continuation } from "../entities";

const contiRepo = AppDataSource.getRepository(Continuation);

export const insertContinuationList = async (list: DeepPartial<Continuation>[]) => {
    let result: any = null;

    result = await contiRepo.insert(list);

    return result;
};

export const saveContinuation = async (input: DeepPartial<Continuation>) => {
    let result: any = null;

    result = await contiRepo.save(input);

    return result;
}

export const updateContinuation = async (postId: any, continuation: any) => {
    let result: any = null;

    result = await contiRepo.update(
        { post: { id: postId } },
        continuation
    );

    return result;
}
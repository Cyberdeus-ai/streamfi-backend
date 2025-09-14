import { AppDataSource } from "../utils/data-source";
import { Relative } from "../entities";

const relativeRepo = AppDataSource.getRepository(Relative);

export const insertRelativeList = async (input: any) => {
    let result: any = null;

    result = await relativeRepo.insert(input);

    return result;
}
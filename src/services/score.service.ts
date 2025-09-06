import { AppDataSource } from "../utils/data-source";
import { Score } from "../entities";

const scoreRepo = AppDataSource.getRepository(Score);

export const findScoreList = async () => {
    let result: any = null;

    result = await scoreRepo.find({
        relations: ["user"]
    });

    return result;
};

export const findFirstScoreList = async () => {
    let result: any = null;

    result = await scoreRepo.find({
        where: {
            is_first: true
        },
        relations: ["user"]
    });

    return result;
}

export const findLatestScoreList = async () => {
    let result: any = null;

    result = await scoreRepo.find({
        where: {
            is_latest: true
        },
        relations: ["user"]
    });

    return result;
}

export const findScoreListByCondition = async (userList: any[], fromDate: Date) => {
    let result: any = null;

    result = await scoreRepo
        .createQueryBuilder('score')
        .innerJoin('score.user', 'user')
        .leftJoin('user.xaccount', 'xaccount')
        .where('user.id IN (:...userIds)', { userIds: userList.map((user: any) => user.id) })
        .andWhere('score.created_at BETWEEN :fromDate AND :now', { fromDate, now: new Date() })
        .orderBy('score.created_at', 'DESC')
        .addOrderBy('score.percentage', 'DESC')
        .select(['score.id', 'score.value', 'score.percentage', 'score.is_latest', 'score.created_at', 'user.id', 'xaccount.username'])
        .getRawMany();

    return result;
}

export const findScoreUserList = async (userList: any[]) => {
    let result: any = null;

    result = await scoreRepo
        .createQueryBuilder('score')
        .innerJoin('score.user', 'user')
        .leftJoin('user.xaccount', 'xaccount')
        .where('user.id IN (:...userIds)', { userIds: userList.map((user: any) => user.id) })
        .andWhere('score.is_latest = :isLatest', { isLatest: true })
        .orderBy('score.percentage', 'DESC')
        .select(['score.value', 'score.percentage', 'score.is_latest', 'score.created_at', 'user.id', 'user.wallet_address', 'xaccount'])
        .getRawMany();

    return result;
}

export const findGainScoreList = async (userList: any[]) => {
    let result: any = null;

    const query = await scoreRepo
        .createQueryBuilder("sc")
        .innerJoin("sc.user", "user")
        .innerJoin("user.xaccount", "xaccount")
        .where('user.id IN (:...userIds)', { userIds: userList.map((user: any) => user.id) })
        .select(['user.id', 'xaccount'])
        .addSelect(subQuery => {
            return subQuery
                .select("percentage")
                .from(Score, "score")
                .where("score.id = sc.id")
                .andWhere("score.is_latest = true")
                .orderBy("score.created_at", "DESC")
                .limit(1);
        }, "current")
        .addSelect(subQuery => {
            return subQuery
                .select("percentage")
                .from(Score, "score")
                .where("score.id = sc.id")
                .andWhere("score.created_at <= CURRENT_DATE + INTERVAL '7 days'")
                .orderBy("score.created_at", "DESC")
                .limit(1);
        }, "oneweek")
        .addSelect(subQuery => {
            return subQuery
                .select("percentage")
                .from(Score, "score")
                .where("score.id = sc.id")
                .andWhere("score.created_at <= CURRENT_DATE + INTERVAL '1 month'")
                .orderBy("score.created_at", "DESC")
                .limit(1);
        }, "onemonth")
        .addSelect(subQuery => {
            return subQuery
                .select("percentage")
                .from(Score, "score")
                .where("score.id = sc.id")
                .andWhere("score.created_at <= CURRENT_DATE + INTERVAL '3 months'")
                .orderBy("score.created_at", "DESC")
                .limit(1);
        }, "threemonths")
        .addSelect(subQuery => {
            return subQuery
                .select("percentage")
                .from(Score, "score")
                .where("score.id = sc.id")
                .andWhere("score.created_at <= CURRENT_DATE + INTERVAL '6 months'")
                .orderBy("score.created_at", "DESC")
                .limit(1);
        }, "sixmonths")
        .addSelect(subQuery => {
            return subQuery
                .select("percentage")
                .from(Score, "score")
                .where("score.id = sc.id")
                .andWhere("score.created_at <= CURRENT_DATE + INTERVAL '1 year'")
                .orderBy("score.created_at", "DESC")
                .limit(1);
        }, "oneyear")
        .orderBy("sc.percentage", "DESC");

    result = await query.getRawMany();

    return result;
}

export const saveScore = async (userId: number, score: number, isFirst?: boolean): Promise<any> => {
    let result: any = null;

    const scoreData: any = {
        user: { id: userId },
        value: score,
        is_first: isFirst
    };

    result = await scoreRepo.save(scoreData);

    return result;
}

export const insertScoreList = async (input: any) => {
    let result: any = null;

    result = await scoreRepo.insert(input);

    return result;
}

export const updateIsLatest = async () => {
    let result: any = null;

    result = await scoreRepo.update(
        { is_latest: true },
        { is_latest: false }
    );

    return result;
}
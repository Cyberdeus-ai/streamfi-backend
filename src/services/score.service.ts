import { AppDataSource } from "../utils/data-source";
import { Score } from "../entities";

const scoreRepo = AppDataSource.getRepository(Score);

export const findUserScoreList = async () => {
    let result: any = null;

    result = await scoreRepo
        .createQueryBuilder("score")
        .innerJoinAndSelect("score.user", "user")
        .where("score.campaign_id IS NULL")
        .orderBy("user.id", "ASC")
        .getMany();

    return result;
}

export const findUserScore = async (userId: number) => {
    let result: any = null;

    result = await scoreRepo.query(
        `SELECT DISTINCT ON (s.user_id)
            s.user_id,
            s.value
         FROM score s
         WHERE s.campaign_id IS NULL
         AND s.user_id = $1
         ORDER BY s.user_id, s.updated_at DESC
         LIMIT 1`,
        [userId]
    );

    return result;
}

export const findCampaignScore = async () => {
    let result: any = null;

    result = await scoreRepo
        .createQueryBuilder("score")
        .where("score.campaign_id IS NOT NULL")
        .orderBy("user.id", "ASC")
        .getMany();

    return result;
}

export const findScoreByCondition = async (condition: any) => {
    let result: any = null;

    result = await scoreRepo.findOneBy(condition);

    return result;
}

export const findLatestScore = async (campaignId: number, userId: number) => {
    let result: any = null;

    result = await scoreRepo.query(
        `SELECT DISTINCT ON (s.user_id)
            s.user_id,
            s.value
         FROM score s
         WHERE s.campaign_id = $1
         AND s.user_id = $2
         ORDER BY s.user_id, s.updated_at DESC
         LIMIT 1`,
        [campaignId, userId]
    );

    return result.length > 0 ? result[0] : null;
}

export const findLatestScoreListByCampaign = async (campaignId: number) => {
    let result: any = null;

    result = await scoreRepo.query(
        `SELECT DISTINCT ON (s.user_id)
            s.user_id,
            s.value
         FROM score s
         WHERE s.campaign_id = $1
         ORDER BY s.user_id, s.updated_at DESC`,
        [campaignId]
    );

    return result;
}

export const findLatestScoreList = async () => {
    let result: any = null;

    result = await scoreRepo.query(
        `SELECT
            campaign_id,
            jsonb_agg(
                jsonb_build_object(
                    'user_id', user_id,
                    'created_at', created_at,
                    'value', value
                )
            ) AS scoreList
        FROM (
            SELECT DISTINCT ON (campaign_id, user_id)
                campaign_id,
                user_id,
                created_at,
                value
            FROM score
            WHERE campaign_id IS NOT NULL
            ORDER BY campaign_id, user_id, created_at DESC, value DESC
        ) AS latest_scores
        GROUP BY campaign_id;`
    );

    return result;
}

export const findUserScoreListByCampaign = async (campaignId: number) => {
    let result: any = null;

    result = await scoreRepo.query(
        `WITH latest_updates AS (
            SELECT DISTINCT ON (s.user_id)
                s.user_id,
                s.created_at,
                s.updated_at,
                s.value,
                s.campaign_id
            FROM score s
            WHERE s.campaign_id = $1
            ORDER BY s.user_id, s.updated_at DESC
        )
        SELECT 
            latest_updates.*, 
            xa.*
        FROM latest_updates
        LEFT JOIN x_account xa ON xa.user_id = latest_updates.user_id
        ORDER BY latest_updates.value DESC`,
        [campaignId]
    );

    return result;
}

export const saveScore = async (userId: number, score: number): Promise<any> => {
    let result: any = null;

    const scoreData: any = {
        user: { id: userId },
        value: score,
    };

    result = await scoreRepo.save(scoreData);

    return result;
}

export const insertScoreList = async (input: any) => {
    let result: any = null;

    result = await scoreRepo.insert(input);

    return result;
}

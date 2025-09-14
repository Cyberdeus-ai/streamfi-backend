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

export const findFirstScoreList = async (campaignId: number) => {
    let result: any = null;

    result = await scoreRepo.query(
        `SELECT DISTINCT ON (s.user_id)
            s.user_id,
            s.created_at,
            s.updated_at,
            s.value,
            s.campaign_id
         FROM score s
         WHERE s.campaign_id = $1
         ORDER BY s.user_id, s.updated_at ASC`,
        [campaignId]
    );

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

export const findScoreListByCondition = async (fromDate: Date, campaignId: number) => {
    let result: any = null;

    result = await scoreRepo.query(`
        SELECT
            user_id,
            array_agg(
                jsonb_build_object('created_at', created_at, 'value', value) 
                ORDER BY created_at ASC, value ASC
            ) AS value_array,
            MAX(value) AS max_value
        FROM
            score
        WHERE
            created_at BETWEEN $1 AND NOW()
            AND campaign_id = $2
        GROUP BY
            user_id
        ORDER BY
            max_value DESC;
    `, [fromDate, campaignId]);

    return result;
}

export const findGainScoreList = async (campaignId: number) => {
    let result: any = null;

    result = await scoreRepo.query(
        `WITH latest_per_user AS (
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
            l.user_id,
            l.created_at,
            l.updated_at,
            l.value AS current,
            l.campaign_id,
            xa.*,
            (SELECT s2.value FROM score s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE + INTERVAL '7 days' ORDER BY s2.created_at DESC LIMIT 1) AS oneweek,
            (SELECT s2.value FROM score s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE + INTERVAL '1 month' ORDER BY s2.created_at DESC LIMIT 1) AS onemonth,
            (SELECT s2.value FROM score s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE + INTERVAL '3 months' ORDER BY s2.created_at DESC LIMIT 1) AS threemonths,
            (SELECT s2.value FROM score s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE + INTERVAL '6 months' ORDER BY s2.created_at DESC LIMIT 1) AS sixmonths,
            (SELECT s2.value FROM score s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE + INTERVAL '1 year' ORDER BY s2.created_at DESC LIMIT 1) AS oneyear
        FROM latest_per_user l
        LEFT JOIN x_account xa ON xa.user_id = l.user_id
        ORDER BY current DESC`,
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

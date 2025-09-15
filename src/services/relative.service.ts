import { AppDataSource } from "../utils/data-source";
import { Relative } from "../entities";

const relativeRepo = AppDataSource.getRepository(Relative);

export const insertRelativeList = async (input: any) => {
    let result: any = null;

    result = await relativeRepo.insert(input);

    return result;
}

export const findGainScoreList = async (campaignId: number) => {
    let result: any = null;

    result = await relativeRepo.query(
        `WITH latest_per_user AS (
            SELECT DISTINCT ON (s.user_id)
                s.user_id,
                s.created_at,
                s.updated_at,
                s.value,
                s.campaign_id
            FROM relative s
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
            (SELECT s2.value FROM relative s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE - INTERVAL '7 days' ORDER BY s2.created_at DESC LIMIT 1) AS oneweek,
            (SELECT s2.value FROM relative s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE - INTERVAL '1 month' ORDER BY s2.created_at DESC LIMIT 1) AS onemonth,
            (SELECT s2.value FROM relative s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE - INTERVAL '3 months' ORDER BY s2.created_at DESC LIMIT 1) AS threemonths,
            (SELECT s2.value FROM relative s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE - INTERVAL '6 months' ORDER BY s2.created_at DESC LIMIT 1) AS sixmonths,
            (SELECT s2.value FROM relative s2 WHERE s2.user_id = l.user_id AND s2.created_at <= CURRENT_DATE - INTERVAL '1 year' ORDER BY s2.created_at DESC LIMIT 1) AS oneyear
        FROM latest_per_user l
        LEFT JOIN x_account xa ON xa.user_id = l.user_id
        ORDER BY current DESC`,
        [campaignId]
    );

    return result;

}

export const findFirstScoreList = async (campaignId: number) => {
    let result: any = null;

    result = await relativeRepo.query(
        `SELECT DISTINCT ON (s.user_id)
            s.user_id,
            s.created_at,
            s.updated_at,
            s.value,
            s.campaign_id
         FROM relative s
         WHERE s.campaign_id = $1
         ORDER BY s.user_id, s.updated_at ASC`,
        [campaignId]
    );

    return result;
}

export const findScoreListByCondition = async (fromDate: Date, campaignId: number) => {
    let result: any = null;

    result = await relativeRepo.query(`
        SELECT
            user_id,
            jsonb_agg(
                jsonb_build_object('created_at', created_at, 'value', value) 
                ORDER BY created_at ASC, value ASC
            ) AS valueList,
            MAX(value) AS max_value
        FROM
            relative
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
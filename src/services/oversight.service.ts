import { DeepPartial, Not } from "typeorm";
import moment from "moment";
import { AppDataSource } from "../utils/data-source";
import { Oversight } from "../entities";

const oversightRepo = AppDataSource.getRepository(Oversight);

export const saveOversight = async (input: any) => {
    let result: any = null;

    result = await oversightRepo.save(input);

    return result;
}

export const findBadUser = async (userId: number) => {
    let result: any = null;

    result = await oversightRepo.findOneBy({
        user: {
            id: userId
        }
    });

    return result;
}

export const updateOversight = async (input: any, userId: number) => {
    let result: any = null;

    result = await oversightRepo.update({ user: { id: userId } }, input);

    return result;
}

export const updateOversightList = async (list: any[], field: string) => {
    let result: any = null;

    const values = list.map((item) => `(${item.id}, ${item[field]})`).join(', ');

    result = await oversightRepo.query(`
        UPDATE oversight t
        SET 
            ${field} = v.${field}
        FROM (VALUES
            ${values}
        ) AS v(user_id, ${field})
        WHERE t.user_id = v.user_id;
    `);

    return result;
}

export const getBadUserList = async () => {
    let result: any = null;

    result = await oversightRepo.query(`
            SELECT 
                os.created_at, os.bot_detection, os.sockpuppet_filters, os.wallet_status, os.is_ban, os.stream_status, 
                xa.*
            FROM oversight os
            LEFT JOIN x_account xa ON xa.user_id = os.user_id
            ORDER BY os.id DESC 
        `);

    return result;
}
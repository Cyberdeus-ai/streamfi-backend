import { Request, Response } from "express";
import { findEngagerList, findUserList } from "../services/user.service";

export const getCampaignListByUserHandler = async (req: Request, res: Response) => {
    try {
        const engagerList = await findEngagerList();
        return engagerList;
    } catch (err) {
        console.error(err);
        return null;
    }
}

export const getUserListHandler = async () => {
    try {
        const userList = await findUserList();
        return userList;
    } catch (err) {
        console.error(err);
        return null;
    }
}
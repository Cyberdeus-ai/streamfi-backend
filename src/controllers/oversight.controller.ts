import { Request, Response } from "express";
import { getBadUserList } from "../services/oversight.service";

export const getBadUserListHandler = async (_req: Request, res: Response) => {
	try {
        const userList = await getBadUserList();

        res.status(200).json({
            result: true,
            userList
        });
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}
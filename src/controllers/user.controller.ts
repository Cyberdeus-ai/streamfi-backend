const dotenv = require('dotenv');

dotenv.config();

import { findEngagerList } from "../services/user.service";

export const getEngagerListHandler = async () => {
    try {
        const engagerList = await findEngagerList();
        return engagerList;
    } catch (err) {
        console.error(err);
        return null;
    }
}
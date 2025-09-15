import { Request, Response } from "express";
import { Framework } from "@superfluid-finance/sdk-core";
import { ethers } from "ethers";
const jwt = require("jsonwebtoken");
import { findUserList } from "../services/user.service";
import { findCampaignListByUser } from "../services/campaign.service";

require('dotenv').config();

export const getCampaignListByUserHandler = async (req: Request, res: Response) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

        const campaignList = await findCampaignListByUser(decoded.id);

        const balanceList = await Promise.all(campaignList.map(async (campaign: any) => {
            return await checkPoolBalance(campaign.reward_pool, "0x30a6933Ca9230361972E413a15dC8114c952414e");
        }));

        const rewardList = campaignList.map((campaign: any, index: number) => {
            return {
                ...campaign,
                balance: balanceList[index]
            };
        });

        res.status(200).json({
            result: true,
            rewardList
        });
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

const checkPoolBalance = async (poolAddress: string, superTokenAddress: string) => {
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const sf = await Framework.create({
        chainId: 11155111,
        provider: provider
    });

    const superToken = await sf.loadSuperToken(superTokenAddress);

    const poolBalance = await superToken.balanceOf({
        account: poolAddress,
        providerOrSigner: provider
    });

    console.log("Pool balance:", ethers.utils.formatUnits(poolBalance, 18));
    return ethers.utils.formatUnits(poolBalance, 18);
}

const checkPoolInflows = async (poolAddress: string, superTokenAddress: string) => {
    const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const sf = await Framework.create({
        chainId: 11155111,
        provider: provider
    });

    const flows = await sf.query.listStreams({
        receiver: poolAddress.toLowerCase(),
        token: superTokenAddress.toLowerCase(),
    });

    console.log("Flows into pool:", flows.items);
    return flows.items;
}
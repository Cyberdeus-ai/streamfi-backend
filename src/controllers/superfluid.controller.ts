import { Request, Response } from "express";
import { ethers } from "ethers";
import superfluidService from "../utils/superfluid";
const jwt = require("jsonwebtoken");
require("dotenv").config();

interface StreamRequest {
    userAddress: string;
    amount: number;
}

interface StreamResponse {
    result: boolean;
    txHash?: string;
    flowRate?: string;
    message?: string;
    error?: string;
}

export const setStreamHandler = async (req: Request, res: Response) => {
    try {
        const { userAddress, amount }: StreamRequest = req.body;

        if (!userAddress || !ethers.utils.isAddress(userAddress)) {
            return res.status(400).json("Invalid user address provided");
        }

        if (typeof amount !== 'number' || amount < 0) {
            return res.status(400).json("Invalid activity score. Must be a non-negative number");
        }

        const existingFlow = await superfluidService.getFlow(userAddress);

        let result;
        let action;

        if (amount === 0) {
            if (existingFlow) {
                result = await superfluidService.deleteStream(userAddress);
                action = "deleted";
            } else {
                return res.status(200).json({
                    result: true,
                    message: "No stream to delete - activity score is 0"
                });
            }
        } else if (existingFlow) {
            result = await superfluidService.updateStream(userAddress, amount);
            action = "updated";
        } else {
            result = await superfluidService.createStream(userAddress, amount);
            action = "created";
        }

        const response: StreamResponse = {
            result: true,
            txHash: result.txn.hash,
            message: `Stream ${action} successfully`,
            ...(result.flowRate && { flowRate: result.flowRate })
        };

        res.status(200).json(response);

    } catch (err: any) {
        console.error("Stream operation failed:", err);
        res.status(500).send(err);
    }
}

export const getSuperFluidInfoHandler = async (req: Request, res: Response) => {
    try {
        const { userAddress } = req.params;

        if (!ethers.utils.isAddress(userAddress)) {
            return res.status(400).json("Invalid user address");
        }

        const flowInfo = await superfluidService.getFlow(userAddress);

        if (!flowInfo) {
            return res.status(200).json({
                result: true,
                hasStream: false,
                message: "No active stream found"
            });
        }

        res.status(200).json({
            result: true,
            hasStream: true,
            flowInfo: {
                ...flowInfo,
                flowRateFormatted: `${ethers.utils.formatEther(flowInfo.flowRate)} tokens/second`
            }
        });

    } catch (err: any) {
        console.error("Failed to get stream info:", err);
        res.status(500).send(err);
    }
}

export const getSuperFluidBalanceHandler = async (_req: Request, res: Response) => {
    try {
        const balance = await superfluidService.getBalance();
        res.status(200).json({
            result: true,
            balance: balance,
            token: "ETHx"
        });
    } catch (err: any) {
        console.error("Failed to get balance:", err);
        res.status(500).send(err);
    }
}

export const deleteStreamHandler = async (req: Request, res: Response) => {
    try {
        const { userAddress } = req.params;

        if (!ethers.utils.isAddress(userAddress)) {
            return res.status(400).json("Invalid user address");
        }

        const existingFlow = await superfluidService.getFlow(userAddress);
        if (!existingFlow) {
            return res.status(200).json({
                result: true,
                message: "No active stream to delete"
            });
        }

        const result = await superfluidService.deleteStream(userAddress);

        res.status(200).json({
            result: true,
            txHash: result.txn.hash,
            message: "Stream deleted successfully"
        });

    } catch (err: any) {
        console.error("Failed to delete stream:", err);
        res.status(500).send(err);
    }
}

export const getSuperFluidHealthHandler = async (_req: Request, res: Response) => {
    try {
        const balance = await superfluidService.getBalance();
        const senderAddress = await superfluidService.getSenderAddress();

        res.status(200).json({
            result: true,
            status: "healthy",
            network: "Sepolia Testnet",
            chainId: 11155111,
            senderAddress: senderAddress,
            balance: balance,
            superToken: "ETHx"
        });
    } catch (err: any) {
        res.status(500).json(err);
    }
}

export const updatePoolMemberUnitsHandler = async (req: Request, res: Response) => {
    try {
        const { poolAddress } = req.params;
        const { member, units } = req.body as { member: string; units: number | string };

        if (!ethers.utils.isAddress(poolAddress)) {
            return res.status(400).json("Invalid pool address");
        }
        if (!ethers.utils.isAddress(member)) {
            return res.status(400).json("Invalid member address");
        }

        const result = await superfluidService.updateMemberUnits(poolAddress, member, units);
        res.status(200).json({ 
            result: true,
            txHash: result,
            message: "Member units updated"
        });
    } catch (err: any) {
        console.error("Failed to update member units:", err);
        res.status(500).json(err);
    }
}

export const distributeFlowHandler = async (req: Request, res: Response) => {
    try {
        const { poolAddress } = req.params;
        const flowRate = req.body.flowRate;

        const token = req.headers.authorization?.split(" ")[1];
        const secretKey = process.env.JWT_SECRET_KEY;
        const decoded = jwt.verify(token!, secretKey);

        if (!ethers.utils.isAddress(poolAddress)) {
            return res.status(400).json("Invalid pool address");
        }

        await superfluidService.distributeFlow(poolAddress, decoded.address, flowRate);
        res.status(200).json({
            result: true,
            message: "Flow into pool created"
        });
    } catch (err: any) {
        console.error("Failed to distribute flow:", err);
        res.status(500).json(err);
    }
}

export const connectPoolHandler = async (req: Request, res: Response) => {
    try {
        const { memberAddress } = req.params;

        if(!ethers.utils.isAddress(memberAddress)) {
            return res.status(400).json("Invalid member address");
        }

        const result = await superfluidService.connectPool(memberAddress);
        res.status(200).json({
            result: result,
            message: "Pool connected"
        });
    } catch (err) {
        console.error("Failed to connect to pool", err);
        res.status(500).send(err);
    }
}

export const disconnectPoolHandler = async (req: Request, res: Response) => {
    try {
        const { memberAddress } = req.params;

        if(!ethers.utils.isAddress(memberAddress)) {
            return res.status(400).json("Invalid member address");
        }

        const result = await superfluidService.disconnectPool(memberAddress);
        res.status(200).json({
            result: result,
            message: "Pool disconnected"
        });
    } catch (err) {
        console.error("Failed to disconnect from pool", err);
        res.status(500).send(err);
    }
}
import { Request, Response } from "express";
import { ethers } from "ethers";
import superfluidService from "../utils/superfluid";

interface StreamRequest {
    userAddress: string;
    activityScore: number;
}

interface StreamResponse {
    success: boolean;
    txHash?: string;
    flowRate?: string;
    message?: string;
    error?: string;
}

export const setStreamBasedOnScore = async (req: Request, res: Response) => {
    try {
        const { userAddress, activityScore }: StreamRequest = req.body;

        if (!userAddress || !ethers.utils.isAddress(userAddress)) {
            return res.status(400).json({
                success: false,
                error: "Invalid user address provided"
            });
        }

        if (typeof activityScore !== 'number' || activityScore < 0) {
            return res.status(400).json({
                success: false,
                error: "Invalid activity score. Must be a non-negative number"
            });
        }

        const existingFlow = await superfluidService.getFlow(userAddress);

        let result;
        let action;

        if (activityScore === 0) {
            if (existingFlow) {
                result = await superfluidService.deleteStream(userAddress);
                action = "deleted";
            } else {
                return res.json({
                    success: true,
                    message: "No stream to delete - activity score is 0"
                });
            }
        } else if (existingFlow) {
            result = await superfluidService.updateStream(userAddress, activityScore);
            action = "updated";
        } else {
            result = await superfluidService.createStream(userAddress, activityScore);
            action = "created";
        }

        const response: StreamResponse = {
            success: true,
            txHash: result.txn.hash,
            message: `Stream ${action} successfully`,
            ...(result.flowRate && { flowRate: result.flowRate })
        };

        res.json(response);

    } catch (error: any) {
        console.error("Stream operation failed:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Internal server error"
        });
    }
}

export const getSuperFluidInfoHandler = async (req: Request, res: Response) => {
    try {
        async (req: Request, res: Response) => {
            try {
                const { userAddress } = req.params;

                if (!ethers.utils.isAddress(userAddress)) {
                    return res.status(400).json({
                        success: false,
                        error: "Invalid user address"
                    });
                }

                const flowInfo = await superfluidService.getFlow(userAddress);

                if (!flowInfo) {
                    return res.json({
                        success: true,
                        hasStream: false,
                        message: "No active stream found"
                    });
                }

                res.json({
                    success: true,
                    hasStream: true,
                    flowInfo: {
                        ...flowInfo,
                        flowRateFormatted: `${ethers.utils.formatEther(flowInfo.flowRate)} tokens/second`
                    }
                });

            } catch (error: any) {
                console.error("Failed to get stream info:", error);
                res.status(500).json({
                    success: false,
                    error: error.message || "Internal server error"
                });
            }
        }
    } catch (err) {
        console.error(err)
        res.status(500).send(err);
    }
}

export const getSuperFluidBalanceHandler = async (req: Request, res: Response) => {
    try {
        const balance = await superfluidService.getBalance();
        res.json({
            success: true,
            balance: balance,
            token: "ETHx"
        });
    } catch (error: any) {
        console.error("Failed to get balance:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Internal server error"
        });
    }
}

export const deleteStreamHandler = async (req: Request, res: Response) => {
    try {
        const { userAddress } = req.params;

        if (!ethers.utils.isAddress(userAddress)) {
            return res.status(400).json({
                success: false,
                error: "Invalid user address"
            });
        }

        const existingFlow = await superfluidService.getFlow(userAddress);
        if (!existingFlow) {
            return res.json({
                success: true,
                message: "No active stream to delete"
            });
        }

        const result = await superfluidService.deleteStream(userAddress);

        res.json({
            success: true,
            txHash: result.txn.hash,
            message: "Stream deleted successfully"
        });

    } catch (error: any) {
        console.error("Failed to delete stream:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Internal server error"
        });
    }
}

export const getSuperFluidHealthHandler = async (req: Request, res: Response) => {
    try {
        const balance = await superfluidService.getBalance();
        const senderAddress = await superfluidService.getSenderAddress();

        res.json({
            success: true,
            status: "healthy",
            network: "Sepolia Testnet",
            chainId: 11155111,
            senderAddress: senderAddress,
            balance: balance,
            superToken: "ETHx"
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            status: "unhealthy",
            error: error.message
        });
    }
}

export const updatePoolMemberUnitsHandler = async (req: Request, res: Response) => {
    try {
        const { poolAddress } = req.params;
        const { member, units } = req.body as { member: string; units: number | string };

        if (!ethers.utils.isAddress(poolAddress)) return res.status(400).json({ success: false, error: "Invalid pool address" });
        if (!ethers.utils.isAddress(member)) return res.status(400).json({ success: false, error: "Invalid member address" });

        const result = await superfluidService.updateMemberUnits(poolAddress, member, units);
        res.json({ success: true, txHash: result, message: "Member units updated" });
    } catch (error: any) {
        console.error("Failed to update member units:", error);
        res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
}

export const distributeInstantHandler = async (req: Request, res: Response) => {
    try {
        const { poolAddress } = req.params;
        const { superToken, adminAddress, amount } = req.body;

        if (!ethers.utils.isAddress(poolAddress)) return res.status(400).json({ success: false, error: "Invalid pool address" });
        if (!amount) return res.status(400).json({ success: false, error: "Amount is required" });

        const result = await superfluidService.distributeInstant(superToken, adminAddress, poolAddress, amount);
        res.json({ success: true, txHash: result.tx.hash, amount: result.amountEther, message: "Distributed to pool" });
    } catch (error: any) {
        console.error("Failed to distribute:", error);
        res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
}

export const createFlowIntoPoolHandler = async (req: Request, res: Response) => {
    try {
        const { poolAddress } = req.params;
        const { activityScore, flowRateWeiPerSec } = req.body as { activityScore?: number; flowRateWeiPerSec?: string };

        if (!ethers.utils.isAddress(poolAddress)) return res.status(400).json({ success: false, error: "Invalid pool address" });

        const result = await superfluidService.createFlowIntoPool(poolAddress, { activityScore, flowRateWeiPerSec });
        res.json({ success: true, txHash: result.txn.hash, flowRate: result.flowRate, message: "Flow into pool created" });
    } catch (error: any) {
        console.error("Failed to create flow into pool:", error);
        res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
}

export const updateFlowIntoPoolHandler = async (req: Request, res: Response) => {
    try {
        const { poolAddress } = req.params;
        const { activityScore, flowRateWeiPerSec } = req.body as { activityScore?: number; flowRateWeiPerSec?: string };

        if (!ethers.utils.isAddress(poolAddress)) return res.status(400).json({ success: false, error: "Invalid pool address" });

        const result = await superfluidService.updateFlowIntoPool(poolAddress, { activityScore, flowRateWeiPerSec });
        res.json({ success: true, txHash: result.txn.hash, flowRate: result.flowRate, message: "Flow into pool updated" });
    } catch (error: any) {
        console.error("Failed to update flow into pool:", error);
        res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
}

export const deleteFlowIntoPoolHandler = async (req: Request, res: Response) => {
    try {
        const { poolAddress } = req.params;
        if (!ethers.utils.isAddress(poolAddress)) return res.status(400).json({ success: false, error: "Invalid pool address" });

        const result = await superfluidService.deleteFlowIntoPool(poolAddress);
        res.json({ success: true, txHash: result.txn.hash, message: "Flow into pool deleted" });
    } catch (error: any) {
        console.error("Failed to delete flow into pool:", error);
        res.status(500).json({ success: false, error: error.message || "Internal server error" });
    }
}
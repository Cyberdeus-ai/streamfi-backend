import { Request, Response } from "express";
const { Framework } = require("@superfluid-finance/sdk-core");
const { ethers } = require("ethers");
require("dotenv").config();

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

interface FlowInfo {
    flowRate: string;
    deposit: string;
    owedDeposit: string;
    timestamp: string;
}

class SuperfluidService {
    private provider: any;
    private sf: any;
    private signer: any;
    private superToken: any;
    private initialized: boolean = false;

    constructor() {
        this.initializeService();
    }

    private async initializeService() {
        try {
            this.provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
            this.sf = await Framework.create({
                chainId: 11155111,
                provider: this.provider
            });
            this.signer = this.sf.createSigner({
                privateKey: process.env.PRIVATE_KEY,
                provider: this.provider
            });
            this.superToken = await this.sf.loadSuperToken("ETHx");
            this.initialized = true;
            console.log("✅ Superfluid service initialized successfully");
        } catch (error) {
            console.error("❌ Failed to initialize Superfluid service:", error);
            throw error;
        }
    }

    private ensureInitialized() {
        if (!this.initialized) {
            throw new Error("Superfluid service not initialized");
        }
    }

    private calculateFlowRate(activityScore: number): string {
        const tokensPerSecond = activityScore * 0.1;
        return (tokensPerSecond * 1e18).toString();
    }

    async getFlow(receiver: string): Promise<FlowInfo | null> {
        this.ensureInitialized();
        try {
            const senderAddress = await this.signer.getAddress();
            const flow = await this.sf.cfaV1.getFlow({
                superToken: this.superToken.address,
                sender: senderAddress,
                receiver: receiver,
                providerOrSigner: this.provider
            });
            
            if (flow.flowRate === "0") {
                return null;
            }
            
            return {
                flowRate: flow.flowRate,
                deposit: flow.deposit,
                owedDeposit: flow.owedDeposit,
                timestamp: flow.timestamp
            };
        } catch (error) {
            console.error("Error getting flow:", error);
            return null;
        }
    }

    async createStream(receiver: string, activityScore: number): Promise<any> {
        this.ensureInitialized();
        const flowRate = this.calculateFlowRate(activityScore);
        
        try {
            const createFlowOperation = this.superToken.createFlow({
                receiver: receiver,
                flowRate: flowRate
            });
            
            const txn = await createFlowOperation.exec(this.signer);
            await txn.wait();
            
            console.log(`✅ Stream created to ${receiver} with flow rate ${flowRate}`);
            return { txn, flowRate };
        } catch (error) {
            console.error("❌ Error creating stream:", error);
            throw error;
        }
    }

    async updateStream(receiver: string, activityScore: number): Promise<any> {
        this.ensureInitialized();
        const flowRate = this.calculateFlowRate(activityScore);
        
        try {
            const updateFlowOperation = this.superToken.updateFlow({
                receiver: receiver,
                flowRate: flowRate
            });
            
            const txn = await updateFlowOperation.exec(this.signer);
            await txn.wait();
            
            console.log(`✅ Stream updated to ${receiver} with new flow rate ${flowRate}`);
            return { txn, flowRate };
        } catch (error) {
            console.error("❌ Error updating stream:", error);
            throw error;
        }
    }

    async deleteStream(receiver: string): Promise<any> {
        this.ensureInitialized();
        
        try {
            const deleteFlowOperation = this.superToken.deleteFlow({
                receiver: receiver
            });
            
            const txn = await deleteFlowOperation.exec(this.signer);
            await txn.wait();
            
            console.log(`✅ Stream deleted to ${receiver}`);
            return { txn };
        } catch (error) {
            console.error("❌ Error deleting stream:", error);
            throw error;
        }
    }

    async getBalance(): Promise<string> {
        this.ensureInitialized();
        try {
            const senderAddress = await this.signer.getAddress();
            const balance = await this.superToken.balanceOf({
                account: senderAddress,
                providerOrSigner: this.provider
            });
            return ethers.utils.formatEther(balance);
        } catch (error) {
            console.error("Error getting balance:", error);
            throw error;
        }
    }

    async getSenderAddress(): Promise<string> {
        this.ensureInitialized();
        try {
            return await this.signer.getAddress();
        } catch (error) {
            console.error("Error getting sender address:", error);
            throw error;
        }
    }
}

const superfluidService = new SuperfluidService();

const superfluid = (app: any) => {
    app.post('/stream-based-on-score', async (req: Request, res: Response) => {
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
    });

    app.get('/stream-info/:userAddress', async (req: Request, res: Response) => {
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
    });

    app.get('/superfluid-balance', async (req: Request, res: Response) => {
        try {
            const balance = await superfluidService.getBalance();
            res.json({
                success: true,
                balance: balance,
                token: "fDAIx"
            });
        } catch (error: any) {
            console.error("Failed to get balance:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Internal server error"
            });
        }
    });

    app.delete('/stream/:userAddress', async (req: Request, res: Response) => {
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
    });

    app.get('/superfluid-health', async (req: Request, res: Response) => {
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
                superToken: "fDAIx"
            });
        } catch (error: any) {
            res.status(500).json({
                success: false,
                status: "unhealthy",
                error: error.message
            });
        }
    });
};

export default superfluid;

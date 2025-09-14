const { Framework } = require("@superfluid-finance/sdk-core");
const { ethers } = require("ethers");
require("dotenv").config();

const { GDAv1Forwarder } = require("./constants");

const forwarderAddress = "0x6DA13Bde224A05a288748d857b9e7DDEffd1dE08";
const forwarderABI = GDAv1Forwarder;

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

            const tokenId = process.env.SUPERFLUID_SUPERTOKEN || "ETHx";
            this.superToken = await this.sf.loadSuperToken(tokenId);
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
        const tokensPerSecond = Math.round(activityScore * 1e18 / 10000 / 2629746);
        return (tokensPerSecond).toString();
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
            const sender = await this.signer.getAddress();

            const balance = await this.superToken.balanceOf({
                account: sender,
                providerOrSigner: this.provider
            });

            if (ethers.BigNumber.from(balance).lte(0)) {
                throw new Error("Insufficient Super Token balance. Wrap/upgrade tokens or fund the account.");
            }

            const createFlowOperation = this.sf.cfaV1.createFlow({
                sender,
                receiver,
                superToken: this.superToken.address,
                flowRate
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

        console.log(flowRate);

        try {
            const sender = await this.signer.getAddress();

            const existingFlow = await this.sf.cfaV1.getFlow({
                superToken: this.superToken.address,
                sender,
                receiver,
                providerOrSigner: this.provider
            });
            if (!existingFlow || existingFlow.flowRate === "0") {
                throw new Error("No existing stream to update. Create a stream first.");
            }

            const updateFlowOperation = this.sf.cfaV1.updateFlow({
                sender,
                receiver,
                superToken: this.superToken.address,
                flowRate
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
            const sender = await this.signer.getAddress();

            const existingFlow = await this.sf.cfaV1.getFlow({
                superToken: this.superToken.address,
                sender,
                receiver,
                providerOrSigner: this.provider
            });
            if (!existingFlow || existingFlow.flowRate === "0") {
                throw new Error("No active stream to delete.");
            }

            const deleteFlowOperation = this.sf.cfaV1.deleteFlow({
                sender,
                receiver,
                superToken: this.superToken.address
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

    async updateMemberUnits(poolAddress: string, member: string, units: string | number) {
        this.ensureInitialized();
        try {
            const contract = new ethers.Contract(forwarderAddress, forwarderABI, this.signer);

            const tx = await contract.updateMemberUnits(
                poolAddress,
                member,
                units,
                "0x"
            );
            await tx.wait();

            console.log(tx);

            return tx;

        } catch (error) {
            console.error("❌ Error updating member units:", error);
            throw error;
        }
    }

    async distributeInstant(superTokenAddress: string, adminAddress: string,  poolAddress: string, amount: string | number) {
        this.ensureInitialized();
        try {
            const contract = new ethers.Contract(
                forwarderAddress,
                forwarderABI,
                this.signer
            );

            const amountEther = ethers.utils.parseEther(amount);

            const tx = await contract.distribute(
                superTokenAddress,
                adminAddress,
                poolAddress,
                amountEther,
                "0x"
            );
            await tx.wait();
            
            console.log(`✅ Distributed ${amountEther} to pool ${poolAddress}`);
            return { tx, amountEther };
        } catch (error) {
            console.error("❌ Error distributing to pool:", error);
            throw error;
        }
    }

    async createFlowIntoPool(poolAddress: string, params: { activityScore?: number; flowRateWeiPerSec?: string; }): Promise<{ txn: any; flowRate: string; }> {
        this.ensureInitialized();
        try {
            let flowRate: string;
            if (params.flowRateWeiPerSec) {
                flowRate = params.flowRateWeiPerSec;
            } else if (typeof params.activityScore === 'number') {
                flowRate = this.calculateFlowRate(params.activityScore);
            } else {
                throw new Error("Provide either flowRateWeiPerSec or activityScore");
            }
            const op = this.sf.poolV1.createFlowIntoPool({
                poolAddress,
                superToken: this.superToken.address,
                flowRate,
            });
            const txn = await op.exec(this.signer);
            await txn.wait();
            console.log(`✅ Created stream into pool ${poolAddress} with flowRate ${flowRate}`);
            return { txn, flowRate };
        } catch (error) {
            console.error("❌ Error creating stream into pool:", error);
            throw error;
        }
    }

    async updateFlowIntoPool(poolAddress: string, params: { activityScore?: number; flowRateWeiPerSec?: string; }): Promise<{ txn: any; flowRate: string; }> {
        this.ensureInitialized();
        try {
            let flowRate: string;
            if (params.flowRateWeiPerSec) {
                flowRate = params.flowRateWeiPerSec;
            } else if (typeof params.activityScore === 'number') {
                flowRate = this.calculateFlowRate(params.activityScore);
            } else {
                throw new Error("Provide either flowRateWeiPerSec or activityScore");
            }
            const op = this.sf.poolV1.updateFlowIntoPool({
                poolAddress,
                superToken: this.superToken.address,
                flowRate,
            });
            const txn = await op.exec(this.signer);
            await txn.wait();
            console.log(`✅ Updated stream into pool ${poolAddress} with flowRate ${flowRate}`);
            return { txn, flowRate };
        } catch (error) {
            console.error("❌ Error updating stream into pool:", error);
            throw error;
        }
    }

    async deleteFlowIntoPool(poolAddress: string): Promise<{ txn: any; }> {
        this.ensureInitialized();
        try {
            const op = this.sf.poolV1.deleteFlowIntoPool({
                poolAddress,
                superToken: this.superToken.address,
            });
            const txn = await op.exec(this.signer);
            await txn.wait();
            console.log(`✅ Deleted stream into pool ${poolAddress}`);
            return { txn };
        } catch (error) {
            console.error("❌ Error deleting stream into pool:", error);
            throw error;
        }
    }
}

const superfluidService = new SuperfluidService();

export default superfluidService;
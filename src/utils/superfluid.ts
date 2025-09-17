import { superTokenAddress } from "./constants";

const { Framework } = require("@superfluid-finance/sdk-core");
const { ethers } = require("ethers");
require("dotenv").config();

const { GDAv1ForwarderAddress, GDAv1ForwarderABI } = require("./constants");

const forwarderAddress = GDAv1ForwarderAddress;
const forwarderABI = GDAv1ForwarderABI;

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

    private calculateFlowRate(amount: number): string {
        const tokensPerSecond = Math.round(amount * 1e18 / 10000 / 2629746);
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

    async createStream(receiver: string, amount: number): Promise<any> {
        this.ensureInitialized();
        const flowRate = this.calculateFlowRate(amount);

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

    async updateStream(receiver: string, amount: number): Promise<any> {
        this.ensureInitialized();
        const flowRate = this.calculateFlowRate(amount);

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

    async checkPoolBalance(poolAddress: string, superTokenAddress: string) {
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

    async checkPoolInflows(poolAddress: string, superTokenAddress: string) {
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

    async updateMemberUnits(poolAddress: string, memberAddress: string, newUnits: string | number) {  
        this.ensureInitialized();
        try {
            const contract = new ethers.Contract(forwarderAddress, forwarderABI, this.signer);

            const tx = await contract.updateMemberUnits(
                poolAddress,
                memberAddress,
                newUnits,
                "0x"
            );
            await tx.wait();

            return tx;
        } catch (error) {
            console.error("❌ Error updating member units:", error);
            throw error;
        }
    }

    async distributeFlow(poolAddress: string, senderAddress: string, flowRate: number) {
        this.ensureInitialized();
        try {
            const contract = new ethers.Contract(forwarderAddress, forwarderABI, this.signer);
            const flowRateWeiPerSecond = this.calculateFlowRate(flowRate);

            const tx = await contract.distributeFlow(
                superTokenAddress,
                senderAddress,
                poolAddress,
                flowRateWeiPerSecond,
                "0x"
            );

            await tx.wait();

            return true;
        } catch (error) {
            console.error("❌ Error creating stream into pool:", error);
            throw error;
        }
    }

    async connectPool(poolAddress: string) {
        this.ensureInitialized();
        try {
            const contract = new ethers.Contract(forwarderAddress, forwarderABI, this.signer);

            const tx = await contract.connectPool(poolAddress, "0x");
            const receipt = await tx.wait();

            console.log("Successfully connected to pool: ", receipt);
            return receipt.status === 1;
        } catch (err) {
            console.error("Error connecting to pool:", err);
            return false;
        }
    }

    async disconnectPool(poolAddress: string) {
        this.ensureInitialized();
        try {
            const contract = new ethers.Contract(forwarderAddress, forwarderABI, this.signer);

            const tx = await contract.disconnectPool(poolAddress, "0x");
            const receipt = await tx.wait();

            console.log("Successfully disconnected from pool: ", receipt);
            return receipt.status === 1;
        } catch (err) {
            console.error("Error connecting to pool:", err);
            return false;
        }
    }
}

const superfluidService = new SuperfluidService();

export default superfluidService;
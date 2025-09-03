import { Request, Response } from "express";
import { ethers } from "ethers";
import { Framework } from "@superfluid-finance/sdk-core";
const dotenv = require('dotenv');

dotenv.config();

const OP_SEPOLIA_CHAIN_ID = 11155420;
const OP_SEPOLIA_RPC_URL = "https://sepolia.infura.io/v3/2c6837284b0c42c2b2c4fb407d785e77";

const FLOW_SPLITTER_ABI = [
    "function createSplit(address superToken, address[] memory recipients, uint256[] memory percentages) external",
    "function updateSplit(address superToken, address[] memory recipients, uint256[] memory percentages) external",
    "function deleteSplit(address superToken) external",
    "function getSplitConfiguration(address superToken) external view returns (address[] memory recipients, uint256[] memory percentages)",
    "function distributeFlow(address superToken, int96 flowRate) external"
];

const FLOW_SPLITTER_ADDRESS = process.env.FLOW_SPLITTER_CONTRACT_ADDRESS || "";

interface SplitRecipient {
    address: string;
    percentage: number;
}

const superfluid = async (app: any) => {
    const providerUrl = process.env.ETH_PROVIDER_URL || OP_SEPOLIA_RPC_URL;
    const privateKey = process.env.PRIVATE_KEY ?? "";

    const provider = new ethers.providers.JsonRpcProvider(providerUrl);
    const wallet = new ethers.Wallet(privateKey, provider);

    const sf = await Framework.create({
        chainId: OP_SEPOLIA_CHAIN_ID,
        provider
    });

    const fDAIx = await sf.loadSuperToken("fDAIx");
    const fUSDCx = await sf.loadSuperToken("fUSDCx");
    
    const flowSplitterContract = new ethers.Contract(
        FLOW_SPLITTER_ADDRESS,
        FLOW_SPLITTER_ABI,
        wallet
    );

    const getSuperToken = (tokenSymbol: string) => {
        switch (tokenSymbol.toLowerCase()) {
            case 'fdaix':
                return fDAIx;
            case 'fusdcx':
                return fUSDCx;
            default:
                return fDAIx;
        }
    };

    const validateSplitPercentages = (recipients: SplitRecipient[]): boolean => {
        const totalPercentage = recipients.reduce((sum, recipient) => sum + recipient.percentage, 0);
        return totalPercentage === 100 && recipients.every(r => r.percentage > 0);
    };

    app.post('/start-stream', async (req: Request, res: Response) => {
        try {
            const { sender, receiver, flowRate, tokenSymbol = 'fDAIx' } = req.body;
            const superToken = getSuperToken(tokenSymbol);

            const createFlowOp = sf.cfaV1.createFlow({
                sender,
                receiver,
                flowRate,
                superToken: superToken.address
            });

            const createTx = await createFlowOp.exec(wallet);
            await createTx.wait();
            
            res.status(200).json({
                result: true,
                message: "Stream started successfully!",
                txHash: createTx.hash,
                superToken: superToken.address
            });
        } catch (err) {
            console.error('Start stream error:', err);
            res.status(500).send(err);
        }
    });

    app.post('/stop-stream', async (req: Request, res: Response) => {
        try {
            const { sender, receiver, tokenSymbol = 'fDAIx' } = req.body;
            const superToken = getSuperToken(tokenSymbol);

            const deleteFlowOp = sf.cfaV1.deleteFlow({
                sender,
                receiver,
                superToken: superToken.address,
            });

            const deleteTx = await deleteFlowOp.exec(wallet);
            await deleteTx.wait();
            
            res.status(200).json({ 
                result: true,
                message: 'Stream stopped successfully!',
                txHash: deleteTx.hash
            });
        } catch (err) {
            console.error('Stop stream error:', err);
            res.status(500).send(err);
        }
    });

    app.post('/create-flow-split', async (req: Request, res: Response) => {
        try {
            const { recipients, tokenSymbol = 'fDAIx' }: { recipients: SplitRecipient[], tokenSymbol?: string } = req.body;
            
            if (!recipients || recipients.length === 0) {
                return res.status(400).json({ error: 'Recipients array is required' });
            }

            if (!validateSplitPercentages(recipients)) {
                return res.status(400).json({ error: 'Split percentages must sum to 100 and all be greater than 0' });
            }

            const superToken = getSuperToken(tokenSymbol);
            const addresses = recipients.map(r => r.address);
            const percentages = recipients.map(r => r.percentage);

            const tx = await flowSplitterContract.createSplit(
                superToken.address,
                addresses,
                percentages
            );
            await tx.wait();

            res.status(200).json({
                result: true,
                message: 'Flow split created successfully!',
                txHash: tx.hash,
                superToken: superToken.address,
                recipients: recipients
            });
        } catch (err) {
            console.error('Create flow split error:', err);
            res.status(500).send(err);
        }
    });

    app.post('/update-flow-split', async (req: Request, res: Response) => {
        try {
            const { recipients, tokenSymbol = 'fDAIx' }: { recipients: SplitRecipient[], tokenSymbol?: string } = req.body;
            
            if (!recipients || recipients.length === 0) {
                return res.status(400).json({ error: 'Recipients array is required' });
            }

            if (!validateSplitPercentages(recipients)) {
                return res.status(400).json({ error: 'Split percentages must sum to 100 and all be greater than 0' });
            }

            const superToken = getSuperToken(tokenSymbol);
            const addresses = recipients.map(r => r.address);
            const percentages = recipients.map(r => r.percentage);

            const tx = await flowSplitterContract.updateSplit(
                superToken.address,
                addresses,
                percentages
            );
            await tx.wait();

            res.status(200).json({
                result: true,
                message: 'Flow split updated successfully!',
                txHash: tx.hash,
                superToken: superToken.address,
                recipients: recipients
            });
        } catch (err) {
            console.error('Update flow split error:', err);
            res.status(500).send(err);
        }
    });

    app.post('/delete-flow-split', async (req: Request, res: Response) => {
        try {
            const { tokenSymbol = 'fDAIx' } = req.body;
            const superToken = getSuperToken(tokenSymbol);

            const tx = await flowSplitterContract.deleteSplit(superToken.address);
            await tx.wait();

            res.status(200).json({
                result: true,
                message: 'Flow split deleted successfully!',
                txHash: tx.hash,
                superToken: superToken.address
            });
        } catch (err) {
            console.error('Delete flow split error:', err);
            res.status(500).send(err);
        }
    });

    app.get('/get-flow-split/:tokenSymbol?', async (req: Request, res: Response) => {
        try {
            const tokenSymbol = req.params.tokenSymbol || 'fDAIx';
            const superToken = getSuperToken(tokenSymbol);

            const [addresses, percentages] = await flowSplitterContract.getSplitConfiguration(superToken.address);
            
            const recipients = addresses.map((address: string, index: number) => ({
                address,
                percentage: percentages[index].toNumber()
            }));

            res.status(200).json({
                result: true,
                superToken: superToken.address,
                tokenSymbol,
                recipients
            });
        } catch (err) {
            console.error('Get flow split error:', err);
            res.status(500).send(err);
        }
    });

    app.post('/start-split-stream', async (req: Request, res: Response) => {
        try {
            const { sender, flowRate, tokenSymbol = 'fDAIx' } = req.body;
            const superToken = getSuperToken(tokenSymbol);

            const createFlowOp = sf.cfaV1.createFlow({
                sender,
                receiver: FLOW_SPLITTER_ADDRESS,
                flowRate,
                superToken: superToken.address
            });

            const createTx = await createFlowOp.exec(wallet);
            await createTx.wait();

            try {
                const distributeTx = await flowSplitterContract.distributeFlow(superToken.address, flowRate);
                await distributeTx.wait();
            } catch (distributeErr) {
                console.log('Distribution might be automatic or already handled:', distributeErr instanceof Error ? distributeErr.message : String(distributeErr));
            }

            res.status(200).json({
                result: true,
                message: "Split stream started successfully!",
                txHash: createTx.hash,
                superToken: superToken.address,
                flowRate,
                splitterAddress: FLOW_SPLITTER_ADDRESS
            });
        } catch (err) {
            console.error('Start split stream error:', err);
            res.status(500).send(err);
        }
    });

    app.post('/stop-split-stream', async (req: Request, res: Response) => {
        try {
            const { sender, tokenSymbol = 'fDAIx' } = req.body;
            const superToken = getSuperToken(tokenSymbol);

            const deleteFlowOp = sf.cfaV1.deleteFlow({
                sender,
                receiver: FLOW_SPLITTER_ADDRESS,
                superToken: superToken.address,
            });

            const deleteTx = await deleteFlowOp.exec(wallet);
            await deleteTx.wait();

            res.status(200).json({
                result: true,
                message: 'Split stream stopped successfully!',
                txHash: deleteTx.hash,
                superToken: superToken.address
            });
        } catch (err) {
            console.error('Stop split stream error:', err);
            res.status(500).send(err);
        }
    });

    app.get('/stream-info/:sender/:receiver/:tokenSymbol?', async (req: Request, res: Response) => {
        try {
            const { sender, receiver, tokenSymbol = 'fDAIx' } = req.params;
            const superToken = getSuperToken(tokenSymbol);

            const flow = await sf.cfaV1.getFlow({
                superToken: superToken.address,
                sender,
                receiver,
                providerOrSigner: provider
            });

            res.status(200).json({
                result: true,
                flow: {
                    flowRate: flow.flowRate,
                    deposit: flow.deposit,
                    owedDeposit: flow.owedDeposit,
                    timestamp: flow.timestamp
                },
                superToken: superToken.address,
                tokenSymbol
            });
        } catch (err) {
            console.error('Get stream info error:', err);
            res.status(500).send(err);
        }
    });

    app.get('/account-flows/:account/:tokenSymbol?', async (req: Request, res: Response) => {
        try {
            const { account, tokenSymbol = 'fDAIx' } = req.params;
            const superToken = getSuperToken(tokenSymbol);

            const accountFlowInfo = await sf.cfaV1.getAccountFlowInfo({
                superToken: superToken.address,
                account,
                providerOrSigner: provider
            });

            res.status(200).json({
                result: true,
                accountFlowInfo: {
                    flowRate: accountFlowInfo.flowRate,
                    deposit: accountFlowInfo.deposit,
                    owedDeposit: accountFlowInfo.owedDeposit
                },
                superToken: superToken.address,
                tokenSymbol
            });
        } catch (err) {
            console.error('Get account flows error:', err);
            res.status(500).send(err);
        }
    });
}

export default superfluid;
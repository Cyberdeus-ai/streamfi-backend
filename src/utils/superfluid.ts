import { Request, Response } from "express";
import { Wallet, JsonRpcProvider } from "ethers";
import { Framework } from "@superfluid-finance/sdk-core";

const superfluid = async (app: any) => {
    const providerUrl = process.env.ETH_PROVIDER_URL;
    const privateKey = process.env.PRIVATE_KEY ?? "";

    const provider = new JsonRpcProvider(providerUrl);
    const wallet = new Wallet(privateKey, provider);

    const sf = await Framework.create({
        chainId: 1,
        provider
    });

    const dai = await sf.loadSuperToken("DAIx");

    app.post('/start-stream', async (req: Request, res: Response) => {
        try {
            const { sender, receiver, flowRate } = req.body;

            const createFlowOp = sf.cfaV1.createFlow({
                sender,
                receiver,
                flowRate,
                superToken: dai.address
            });

            const createTx = await createFlowOp.exec(wallet);
            await createTx.wait();
            res.status(200).json({
                result: true,
                message: "Stream started successfully!"
            });
        } catch (err) {
            console.error(err);
            res.status(500).send(err);
        }
    })

    app.post('/stop-stream', async (req: Request, res: Response) => {
        try {
            const { sender, receiver } = req.body;

            const deleteFlowOp = sf.cfaV1.deleteFlow({
                sender,
                receiver,
                superToken: dai.address,
            });

            const deleteTx = await deleteFlowOp.exec(wallet);
            await deleteTx.wait();
            res.status(200).json({ 
                result: true,
                message: 'Stream stopped successfully!'
            });
        } catch (err) {
            res.status(500).send(err);
        }
    });
}

export default superfluid;
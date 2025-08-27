import { Request, Response, NextFunction } from 'express';
import { ethers, id } from "ethers";
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

import { createUser, findUserByAddress } from "../services/user.service";

const provider = new ethers.JsonRpcProvider("https://mainnet.infura.io/v3/2c6837284b0c42c2b2c4fb407d785e77");

const getProfileFromAddress = async (address: string) => {
    try {
        const ensName = await provider.lookupAddress(address);
        if (ensName) {
            console.log(`${address} resolves to ENS name: ${ensName}`);

            const profile = await getENSProfile(ensName);
            console.log("User Profile:", profile);
            return profile;
        } else {
            console.log(`${address} does not have an associated ENS name.`);
            return null;
        }
    } catch (error) {
        console.error("Error resolving wallet address:", error);
    }
}

const getENSProfile = async (ensName: string) => {
    try {
        const resolver = await provider.getResolver(ensName);
        if(resolver) {
            const email = await resolver.getText("email");
            const name = await resolver.getText("name");
            return { email, name };
        } else {
            console.log(`No resolver found for ENS name: ${ensName}`);
            return null;
        }
    } catch (err) {
        console.error("Error fetching ENS profile:", err);    
    }
}

export const signUpHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        if(!req.body.address) {
            res.status(400).json("Not Fill wallet address");
        }

        const profile = await getProfileFromAddress(req.body.address);

        if(profile === null){
            return res.status(401).json("Wallet Address Not Found")
        }

        await createUser({
            name: profile?.name ?? "",
            wallet_address: req.body.address,
            email: profile?.email ?? "",
            twitter_account: req.body.twitterAccount,
            account_type: req.body.accountType,
            campaigns: [],
            posts: [],
            scores: []
        });

        res.status(200).json({
            result: true,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}

export const signInHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        if(!req.body.address) {
            res.status(400).json("Not Fill wallet address");
        }

        const user = await findUserByAddress(req.body.address);

        const payload = {
            id: user.id,
            address: user.wallet_address
        };
        const secretKey = process.env.JWT_SECRET_KEY;
        const options = {
            expiresIn: "2h"
        };
        const token = jwt.sign(payload, secretKey!, options);

        res.status(200).json({
            result: true,
            token: token,
            user: user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);       
    }
}

export const signInWithTokenHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const oldToken = req.headers.authorization?.split(" ")[1];
        const secretKey = process.env.JWT_SECRET_KEY;
        const decoded = jwt.verify(oldToken, secretKey);

        const user = await findUserByAddress(decoded.address);

        const payload = {
            id: user.id,
            address: user.wallet_address
        };
        const options = {
            expiresIn: "2h"
        };
        const newToken = jwt.sign(payload, secretKey!, options);

        res.status(200).json({
            result: true,
            token: newToken,
            user: user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}
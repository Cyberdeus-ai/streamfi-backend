import { Request, Response, NextFunction } from 'express';
import { generateNonce, SiweMessage } from 'siwe';
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

import { createUser, findUserByAddress, findUserByTwitterAccount } from "../services/user.service";

export const getNonceHandler = async (_req: Request, res: Response, _next: NextFunction) => {
    try {
        const nonce = generateNonce();
        res.status(200).json({
            result: true,
            nonce: nonce
        })
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}

export const verifyHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        if(!req.body.message) {
            res.status(400).json('Expected prepareMessage object as body.');
            return;
        }

        if(!req.body.address) {
            res.status(400).json('Wallet Address is required.');
            return;
        }
        
        const exist = await findUserByAddress(req.body.address);

        if(exist) {
            res.status(409).json("Already Sign up");
            return;
        }

        let SIWEObject = new SiweMessage(req.body.message);
        const {data: message} = await SIWEObject.verify({signature: req.body.signature, nonce: req.body.nonce});

        res.status(200).json({
            result: message.nonce === req.body.nonce && message.address === req.body.address
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}

export const signUpHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        if(!req.body.address) {
            res.status(400).json("Not Fill wallet address");
        }

        const exist = await findUserByTwitterAccount(req.body.twitterAccount);

        if(exist) {
            res.status(409).json("Twitter account already Exist");
        }

        await createUser({
            wallet_address: req.body.address,
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
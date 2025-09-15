import { Request, Response, NextFunction } from 'express';
import { generateNonce, SiweMessage } from 'siwe';
import moment from 'moment';
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

import { saveUser, updateUser, findUserByCondition, updateIpAddress } from "../services/user.service";
import { findProfileByCondition, saveProfile } from "../services/xaccount.service";
import { saveScore } from "../services/score.service";
import { findCampaignCountByUser } from '../services/campaign.service';
import { saveOversight } from '../services/oversight.service';
import { getTwitterAccount } from '../utils/scraper';
import scoreConfig from '../utils/score-settings';

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
        if (!req.body.message) {
            res.status(400).json('Expected prepareMessage object as body.');
            return;
        }

        if (!req.body.address) {
            res.status(400).json('Wallet Address is required.');
            return;
        }

        const exist = await findUserByCondition({
            wallet_address: req.body.address
        });

        if (exist) {
            res.status(409).json("Already Sign up");
            return;
        }

        let SIWEObject = new SiweMessage(req.body.message);
        const { data: message } = await SIWEObject.verify({ signature: req.body.signature, nonce: req.body.nonce });

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
        if (!req.body.address) {
            res.status(400).json("Not Fill wallet address");
        }

        const exist = await findProfileByCondition({
            username: req.body.twitterAccount
        });

        if (exist) {
            res.status(409).json("Twitter account already Exist");
        }

        const twitterAccount = await getTwitterAccount(req.body.twitterAccount);

        const sameIp = await findUserByCondition({ ip_address: req.ip });

        const user = await saveUser({
            wallet_address: req.body.address,
            ip_address: req.ip
        });

        if (sameIp) {
            await saveOversight({
                user: { id: user.id },
                sockpuppet_filters: "Same IP address"
            });
        } else {
            await saveOversight({ user: { id: user.id } });
        }

        console.log(twitterAccount);

        if (twitterAccount?.user_id) {
            saveProfile({
                id: twitterAccount.user_id,
                username: twitterAccount.username,
                name: twitterAccount.name,
                follower_count: twitterAccount.follower_count,
                is_verified: twitterAccount.is_verified,
                is_blue_verified: twitterAccount.is_blue_verified,
                profile_pic_url: twitterAccount.profile_image_url,
                number_of_tweets: twitterAccount.number_of_tweets,
                bot: twitterAccount.bot,
                created_at: moment(twitterAccount.timestamp * 1000),
                user: { id: user.id }
            });

            let score: number = 0;

            if (twitterAccount.is_blue_verified || twitterAccount.is_verified) {
                score += scoreConfig.verification;
            }

            score += twitterAccount.follower_count / 100000 * scoreConfig.bigAccounts;

            score += (new Date().getTime() - new Date(twitterAccount.timestamp * 1000).getTime()) / 1000 / 3600 / 8760 * scoreConfig.accountAge;

            await saveScore(user.id, score);
        }

        res.status(200).json({
            result: true,
            userId: user.id
        });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}

export const setAccountTypeHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        await updateUser(req.body.userId, req.body.accountType);

        res.status(200).json({ result: true });
    } catch (err) {
        console.error(err);
        res.status(500).send(err);
    }
}

export const signInHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        if (!req.body.address) {
            res.status(400).json("Not Fill wallet address");
        }

        const user = await findUserByCondition({
            wallet_address: req.body.address
        });

        const payload = {
            id: user.id,
            address: user.wallet_address
        };
        const secretKey = process.env.JWT_SECRET_KEY;
        const options = {
            expiresIn: "2h"
        };
        const token = jwt.sign(payload, secretKey, options);

        const profile = await findProfileByCondition({
            user: { id: user.id }
        });

        const campaignCount = await findCampaignCountByUser(user.id);

        res.status(200).json({
            result: true,
            token: token,
            user: { ...profile, campaignCount: campaignCount }
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

        const user = await findUserByCondition({
            wallet_address: decoded.address
        });

        const payload = {
            id: user.id,
            address: user.wallet_address
        };
        const options = {
            expiresIn: "2h"
        };
        const newToken = jwt.sign(payload, secretKey, options);

        const profile = await findProfileByCondition({
            user: user.id
        });

        const campaignCount = await findCampaignCountByUser(user.id);

        res.status(200).json({
            result: true,
            token: newToken,
            user: { ...profile, campaignCount: campaignCount }
        });
    } catch (err) {
        console.error(err);
        res.status(401).send(err);
    }
}
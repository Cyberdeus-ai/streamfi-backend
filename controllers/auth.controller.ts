import { Request, Response, NextFunction } from 'express';
import { generateNonce, SiweMessage } from 'siwe';
import moment from 'moment';
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

import { saveUser, updateUser, findUserByCondition } from "../services/user.service";
import { findProfileByCondition, saveProfile } from "../services/xaccount.service";
import { getTwitterAccount } from '../utils/scraper';

export const getNonceHandler = async (_req: Request, res: Response, _next: NextFunction) => {
    try {
        const nonce = generateNonce();
        res.status(200).json({
            result: true,
            nonce: nonce
        })
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to generate nonce'
        });
    }
}

export const verifyHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        if (!req.body.message) {
            res.status(400).json({
                result: false,
                error: 'Message is required'
            });
            return;
        }

        if (!req.body.address) {
            res.status(400).json({
                result: false,
                error: 'Wallet Address is required'
            });
            return;
        }

        const exist = await findUserByCondition({
            wallet_address: req.body.address
        });

        if (exist) {
            res.status(409).json({
                result: false,
                error: 'Already Sign up'
            });
            return;
        }

        let SIWEObject = new SiweMessage(req.body.message);
        const { data: message } = await SIWEObject.verify({ signature: req.body.signature, nonce: req.body.nonce });

        res.status(200).json({
            result: message.nonce === req.body.nonce && message.address === req.body.address
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to verify'
        });
    }
}

export const signUpHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        if (!req.body.address) {
            res.status(400).json({
                result: false,
                error: 'Not Fill wallet address'
            });
            return;
        }

        const exist = await findProfileByCondition({
            username: req.body.twitterAccount
        });

        if (exist) {
            res.status(409).json({
                result: false,
                error: 'Twitter account already Exist'
            });
            return;
        }

        const twitterAccount = await getTwitterAccount(req.body.twitterAccount);

        console.log(twitterAccount);

        if (twitterAccount?.user_id) {

            const user = await saveUser({
                wallet_address: req.body.address,
                avatar: twitterAccount.profile_pic_url || process.env.IMAGE_HOST + 'avatar.jpg',
                ip_address: req.ip
            });

            await saveProfile({
                id: twitterAccount.user_id,
                username: twitterAccount.username,
                name: twitterAccount.name,
                follower_count: twitterAccount.follower_count,
                is_verified: twitterAccount.is_verified,
                is_blue_verified: twitterAccount.is_blue_verified,
                profile_pic_url: twitterAccount.profile_pic_url,
                number_of_tweets: twitterAccount.number_of_tweets,
                bot: twitterAccount.bot,
                created_at: moment(twitterAccount.timestamp * 1000),
                user: { id: user.id }
            });

            res.status(200).json({
                result: true,
                userId: user.id
            });
        }

        else {
            res.status(400).json({
                result: false,
                error: 'Invalid Twitter Account'
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to sign up'
        });
    }
}

export const setAccountTypeHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        await updateUser(req.body.userId, req.body.accountType);

        res.status(200).json({ result: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to set account type'
        });
    }
}

export const signInHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        if (!req.body.address) {
            res.status(400).json({
                result: false,
                error: 'Not Fill wallet address'
            });
            return;
        }

        const user = await findUserByCondition({
            wallet_address: req.body.address
        });

        if (!user) {
            res.status(404).json({
                result: false,
                error: 'User not found'
            });
            return;
        }

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

        if (!profile) {
            res.status(404).json({
                result: false,
                error: 'Profile not found'
            });
            return;
        }

        res.status(200).json({
            result: true,
            token: token,
            user: { 
                id: user.id,
                name: profile.name,
                username: profile.username,
                email: user.email,
                address: user.wallet_address,
                avatar: user.avatar,
                rank: user.rank,
                rank_growth: user.rank_growth,
                points: user.points,
                points_growth: user.points_growth,
                referrals_growth: user.referrals_growth,
                flow_rate: user.flow_rate,
                earnings_growth: user.earnings_growth,
                account_type: user.account_type,
                campaigns_growth: user.campaigns_growth
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to sign in'
        });
    }
}
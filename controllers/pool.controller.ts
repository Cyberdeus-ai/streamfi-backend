import { Request, Response, NextFunction } from 'express';
import {
    savePool,
    findPoolListByUserId,
    updatePool,
    findSuperToken
} from '../services/pool.service';

export const createPoolHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const pool = await savePool(req.body);

        res.status(200).json({
            result: true,
            pool: pool
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to create pool'
        });
    }
}

export const checkSuperTokenHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const superTokenAddress = req.body.superTokenAddress;
        const userId = parseInt(req.body.id);
        const exist = await findSuperToken(superTokenAddress, userId);
        if (exist) {
            res.status(200).json({
                result: true,
            });
        } else {
            res.status(200).json({
                result: false
            });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to check super token'
        });
    }
}

export const getPoolListHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const userId = Number(req.params.userId);

        const pools = await findPoolListByUserId(userId);

        res.status(200).json({
            result: true,
            pools: pools
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to get pool list'
        });
    }
}

export const updatePoolHandler = async (req: Request, res: Response, _next: NextFunction) => {
    try {
        const poolId = Number(req.params.poolId);

        if (isNaN(poolId)) {
            res.status(400).json({
                result: false,
                error: 'Invalid pool ID'
            });
            return;
        }

        await updatePool(poolId, parseFloat(req.body.flowRate), req.body.flowRateUnit);

        res.status(200).json({
            result: true
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            result: false,
            error: 'Failed to update pool'
        });
    }
}


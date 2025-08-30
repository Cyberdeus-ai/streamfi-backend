import { Request, Response, NextFunction } from "express";
const jwt = require("jsonwebtoken");

import { AppDataSource } from '../utils/data-source';
import { User } from '../entities/user.entity';

const userRepo = AppDataSource.getRepository(User);

import dotenv from "dotenv";
dotenv.config();

export async function tokenValidation(req: Request, res: Response, next: NextFunction) {
    try {
        if (String(req.headers.authorization).length < 10) {
            res.status(401).json("Token is empty");
        }

        const token = req.headers.authorization?.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!);

        const currentTime = Date.now() / 1000;

        if (decoded.exp < currentTime) {
            res.send(401).json("Token is expired");
        }

        const user = await userRepo.findOneBy({
            wallet_address: decoded.address
        });

        if (!user) {
            return res.status(401).json("Invalid token");
        } else {
            next();
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
}
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Campaign, Post, Score, XAccount, Continuation } from '../entities';
require("dotenv").config();

export const AppDataSource = new DataSource({
    type: process.env.DB_TYPE as any,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: true,
    entities: [User, Campaign, Post, Score, XAccount, Continuation],
    migrations: [],
    subscribers: [],
});
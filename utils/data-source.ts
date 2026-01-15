import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, XAccount, Campaign, Pool, Join, Activity, Flowrate } from '../entities';
require('dotenv').config();

export const AppDataSource = new DataSource({
    type: process.env.DB_TYPE as any,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    synchronize: true,
    logging: true,
    entities: [User, XAccount, Campaign, Pool, Join, Activity, Flowrate],
    migrations: [],
    subscribers: [],
});

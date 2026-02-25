import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, XAccount, Campaign, Pool, Join, Activity, Flowrate } from '../entities';
require('dotenv').config();

export const AppDataSource = new DataSource({
    url: process.env.DATABASE_URL,
    type: 'postgres',
    ssl: { rejectUnauthorized: false },
    synchronize: true,
    logging: true,
    entities: [User, XAccount, Campaign, Pool, Join, Activity, Flowrate],
    migrations: [],
    subscribers: [],
});

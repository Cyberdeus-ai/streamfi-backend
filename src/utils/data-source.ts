import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User, Campaign, Post, Score } from '../entities';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '123456789',
    database: 'streamfi',
    synchronize: true,
    logging: true,
    entities: [User, Campaign, Post, Score],
    migrations: [],
    subscribers: [],
});
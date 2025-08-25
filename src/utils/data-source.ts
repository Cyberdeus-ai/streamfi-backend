import 'reflect-metadata';
import { DataSource } from 'typeorm';

export const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: '123456789',
    database: 'streamfi',
    synchronize: true,
    logging: true,
    entities: [],
    migrations: [],
    subscribers: [],
});
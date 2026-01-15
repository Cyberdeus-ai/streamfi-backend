import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";
import Model from "./model.entity";

import { User } from "./user.entity";
import { Pool } from "./pool.entity";

@Entity()
export class Campaign extends Model {
    @Column({ length: 100, nullable: true })
    name: string;

    @Column('text', { nullable: true })
    description: string;

    @Column({ length: 255, nullable: true })
    logo: string;

    @Column({ length: 255, nullable: true })
    website: string;

    @Column({ length: 100, nullable: true })
    twitter: string;

    @Column('text', { nullable: true })
    about: string;

    @Column('text', { array: true })
    guidelines: string[];

    @Column('jsonb')
    templates: { type: string; title: string; preview: string }[];

    @Column({ default: 1 })
    quote: number;

    @Column({ default: 1 })
    comment: number;

    @Column({ default: 1 })
    repost: number;

    @Column({ type: 'timestamptz', precision: 3, default: () => `now()` })
    start_date: Date;

    @Column({ type: 'timestamptz', precision: 3, default: () => `now()` })
    end_date: Date;

    @Column('text', { array: true })
    hashtags: string[];

    @Column('text', { array: true })
    tickers: string[];

    @Column('text', { array: true })
    big_accounts: string[];

    @Column({ default: 0 })
    promoters: number;

    @Column({ default: 0 })
    old_promoters: number;

    @ManyToOne(() => Pool)
    @JoinColumn({ name: 'pool_id' })
    pool: Pool;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;
}
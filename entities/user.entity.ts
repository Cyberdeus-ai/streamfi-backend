import { Entity, Column, OneToOne, OneToMany } from "typeorm";
import Model from "./model.entity";
import { XAccount } from "./xaccount.entity";
import { Campaign } from "./campaign.entity";
import { Pool } from "./pool.entity";

@Entity()
export class User extends Model {
    @Column({ unique: true, length: 255 })
    wallet_address: string;

    @Column({ length: 100, nullable: true })
    email: string;

    @Column({ length: 100, nullable: true })
    avatar: string;

    @Column({ length: 100, nullable: true })
    account_type: string;

    @Column({ default: 0 })
    campaigns_growth: number;

    @Column({ default: 0 })
    rank: number;

    @Column({ default: 0 })
    rank_growth: number;

    @Column({ default: 0 })
    points: number;

    @Column({ default: 0 })
    points_growth: number;

    @Column({ default: 0 })
    referrals: number;

    @Column({ default: 0 })
    referrals_growth: number;

    @Column('float', { default: 0.00 })
    flow_rate: number;

    @Column('float', { default: 0.00 })
    flow_rate_growth: number;

    @Column('float', { default: 0.00 })
    earnings: number;

    @Column('float', { default: 0.00 })
    earnings_growth: number;

    @Column({ length: 100, nullable: true })
    ip_address: string;

    @OneToOne(() => XAccount, (xaccount) => xaccount.user)
    xaccount: XAccount;

    @OneToMany(() => Campaign, (campaign) => campaign.user)
    campaigns: Campaign[];

    @OneToMany(() => Pool, (pool) => pool.user)
    pools: Pool[];
}
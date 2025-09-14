import { Entity, Column, OneToMany, OneToOne } from "typeorm";

import Model from "./model.entity";
import { Campaign } from "./campaign.entity";
import { Post } from "./post.entity";
import { Score } from "./score.entity";
import { XAccount } from "./xaccount.entity";
import { Oversight } from "./oversight.entity";
import { Relative } from "./relative.entity";

@Entity()
export class User extends Model
{
    @Column({ unique: true, length: 100 })
    wallet_address: string;

    @Column({ length: 100, nullable: true })
    account_type: string;

    @Column({ length: 100, nullable: true })
    ip_address: string;

    @OneToOne(() => XAccount, (xaccount) => xaccount.user)
    xaccount: XAccount;

    @OneToMany(() => Campaign, (campaign) => campaign.user)
    campaigns: Campaign[];

    @OneToMany(() => Post, (post) => post.user)
    posts: Post[];

    @OneToMany(() => Score, (score) => score.user)
    scores: Score[];

    @OneToMany(() => Relative, (relative) => relative)
    relatives: Relative[]

    @OneToOne(() => Oversight, (oversight) => oversight.user)
    oversight: Oversight;
}
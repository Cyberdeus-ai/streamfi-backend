import { Entity, Column, OneToMany, OneToOne } from "typeorm";

import Model from "./model.entity";
import { Campaign } from "./campaign.entity";
import { Post } from "./post.entity";
import { Score } from "./score.entity";

@Entity()
export class User extends Model
{
    @Column({ unique: true, length: 100 })
    wallet_address: string;

    @Column({ length: 100 })
    account_type: string;

    @OneToMany(() => Campaign, (campaign) => campaign.user)
    campaigns: Campaign[];

    @OneToMany(() => Post, (post) => post.user)
    posts: Post[];

    @OneToMany(() => Score, (score) => score.user)
    scores: Score[];
}
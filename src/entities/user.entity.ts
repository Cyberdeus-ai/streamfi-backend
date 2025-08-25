import { Entity, Column, OneToMany } from "typeorm";

import Model from "./model.entity";
import { Campaign } from "./campaign.entity";
import { Post } from "./post.entity";
import { Score } from "./score.entity";

@Entity()
export class User extends Model
{
    @Column({ length: 100})
    name: string;

    @Column({ unique: true, length: 100 })
    username: string;

    @Column({ unique: true, length: 100 })
    walletAddress: string;

    @Column({ length: 100 })
    password: string;

    @OneToMany(() => Campaign, (campaign) => campaign.user)
    campaigns: Campaign[];

    @OneToMany(() => Post, (post) => post.user)
    posts: Post[];

    @OneToMany(() => Score, (score) => score.user)
    scores: Score[];
}
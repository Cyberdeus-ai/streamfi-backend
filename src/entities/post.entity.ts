import { Entity, Column, JoinColumn, ManyToOne, OneToMany, OneToOne } from "typeorm";

import Model from './model.entity';
import { Campaign } from "./campaign.entity";
import { User } from "./user.entity";
import { Continuation } from "./continuation.entity";

@Entity()
export class Post extends Model
{
    @Column({ length: 100 })
    tweet_id: string;
    
    @Column({ length: 100 })
    type: string;

    @Column({ type: 'timestamptz', precision: 3, default: () => `now()` })
    timestamp: Date;

    @OneToOne(() => Continuation, (continuation) => continuation.post)
    continuation: Continuation;
    
    @ManyToOne(() => User, (user) => user.posts)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Campaign, (campaign) => campaign.posts)
    @JoinColumn({ name: 'campaign_id' })
    campaign: Campaign;

};
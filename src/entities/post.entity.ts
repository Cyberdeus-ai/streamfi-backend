import { Entity, Column, JoinColumn, ManyToOne } from "typeorm";

import Model from './model.entity';
import { Campaign } from "./campaign.entity";
import { User } from "./user.entity";

@Entity()
export class Post extends Model
{
    @Column({ length: 100 })
    type: string;
    
    @ManyToOne(() => User, (user) => user.posts)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Campaign, (campaign) => campaign.posts)
    @JoinColumn({ name: 'campaign_id' })
    campaign: Campaign;

};
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import Model from './model.entity';
import { User } from './user.entity';
import { Campaign } from './campaign.entity';

@Entity()
export class Pool extends Model {
    @Column({ type: 'double precision' })
    is_connected: boolean;

    @ManyToOne(() => User, (user) => user.scores)
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => Campaign, (campaign) => campaign.scores, { nullable: true })
    @JoinColumn({ name: "campaign_id" })
    campaign: Campaign;
}
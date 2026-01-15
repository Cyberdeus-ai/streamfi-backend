import { Entity, ManyToOne, JoinColumn, Column } from "typeorm";
import Model from "./model.entity";

import { User } from "./user.entity";
import { Campaign } from "./campaign.entity";

@Entity()
export class Activity extends Model {
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @ManyToOne(() => Campaign)
    @JoinColumn({ name: 'campaign_id' })
    campaign: Campaign;

    @Column({ type: 'enum', enum: ['quote', 'comment', 'repost'] })
    type: "quote" | "comment" | "repost";

    @Column({ type: 'timestamptz', precision: 3, default: () => `now()` })
    time: Date;

    @Column({ nullable: true })
    points: number;
}
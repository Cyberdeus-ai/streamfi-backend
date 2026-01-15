import { Entity, ManyToOne, JoinColumn, Column } from "typeorm";
import Model from "./model.entity";
import { User } from "./user.entity";
import { Campaign } from "./campaign.entity";

@Entity()
export class Join extends Model {
    @ManyToOne(() => User)
    @JoinColumn({ name: 'promoter' })
    promoter: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'referer' })
    referer: User;

    @Column({ length: 100, nullable: true })
    bot_detection: string;

    @Column({ length: 100, nullable: true })
    sockpuppet_filters: string;

    @Column({ nullable: true })
    wallet_status: boolean;

    @Column({ nullable: true })
    is_ban: boolean;

    @Column({ nullable: true })
    stream_status: boolean;

    @Column({ default: 0 })
    rank: number;

    @Column({ default: 0 })
    points: number;

    @ManyToOne(() => Campaign)
    @JoinColumn({ name: 'campaign_id' })
    campaign: Campaign;
}

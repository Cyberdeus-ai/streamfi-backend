import { Entity, Column, JoinColumn, ManyToOne, OneToOne } from "typeorm";

import Model from './model.entity';
import { Campaign } from "./campaign.entity";
import { User } from "./user.entity";
import { Continuation } from "./continuation.entity";

@Entity()
export class Oversight extends Model {
    @Column({ type: 'timestamptz', precision: 3, default: () => `now()` })
    joined_at: Date;

    @Column({ length: 100, nullable: true })
    bot_detection: string;

    @Column({ length: 100, nullable: true })
    sockpuppet_filters: string;

    @Column({ length: 100, nullable: true })
    wallet_status: string;

    @Column({ length: 100, nullable: true })
    is_ban: string;

    @Column({ length: 100, nullable: true })
    stream_status: string;

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

};
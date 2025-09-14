import { Entity, Column, JoinColumn, ManyToOne, OneToOne } from "typeorm";

import Model from './model.entity';
import { Campaign } from "./campaign.entity";
import { User } from "./user.entity";
import { Continuation } from "./continuation.entity";

@Entity()
export class Oversight extends Model {

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

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

};
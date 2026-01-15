import { Entity, Column, ManyToOne, JoinColumn } from "typeorm";

import Model from "./model.entity";
import { User } from "./user.entity";

@Entity()
export class Flowrate extends Model {
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column('jsonb', { nullable: true })
    flow_rates: { time: string; flow_rate: number }[];
}
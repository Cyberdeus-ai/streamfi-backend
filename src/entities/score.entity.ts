import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import Model from './model.entity';
import { User } from './user.entity';

@Entity()
export class Score extends Model
{
    @Column({ type: 'double precision' })
    score: number;

    @Column({ default: true })
    is_latest: boolean;

    @ManyToOne(() => User, (user) => user.scores)
    @JoinColumn({ name: "user_id" })
    user: User;
}
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import Model from './model.entity';
import { User } from './user.entity';

@Entity()
export class Score extends Model
{
    @Column({ type: 'double precision' })
    value: number;

    @Column({ type: 'double precision', default: 0.0 })
    percentage: number;

    @Column({ default: false })
    is_first: boolean;
    
    @Column({ default: true })
    is_latest: boolean;

    @ManyToOne(() => User, (user) => user.scores)
    @JoinColumn({ name: "user_id" })
    user: User;
}
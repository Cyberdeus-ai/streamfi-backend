import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import Model from './model.entity';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity()
export class Campaign extends Model
{
    @Column({ type: 'timestamptz', precision: 3, default: () => `now()` })
    start_date: Date;

    @Column({ type: 'timestamptz', precision: 3, default: () => `now()` })
    end_date: Date;

    @Column('text', { array: true })
    hashtags: string[];

    @Column('text', { array: true })
    tickers: string[];

    @Column('text', { array: true })
    handles: string[];

    @Column({ type: 'double precision' })
    reward_pool: number;

    @Column('text', { array: true })
    big_accounts: string[];

    @OneToMany(() => Post, (post) => post.campaign)
    posts: Post[];

    @ManyToOne(() => User, (user) => user.campaigns)
    @JoinColumn({ name: "user_id" })
    user: User
}
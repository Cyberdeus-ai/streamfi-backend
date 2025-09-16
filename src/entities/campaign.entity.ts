import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import Model from './model.entity';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Score } from './score.entity';
import { Relative } from './relative.entity';
import { Pool } from './pool.entity';

@Entity()
export class Campaign extends Model
{
    @Column({ length: 100, nullable: true })
    name: string;
    
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

    @Column({ length: 255, nullable: true })
    reward_pool: string;

    @Column('text', { array: true })
    big_accounts: string[];

    @OneToMany(() => Post, (post) => post.campaign)
    posts: Post[];

    @OneToMany(() => Score, (score) => score.campaign)
    scores: Score[]

    @OneToMany(() => Relative, (relative) => relative.campaign)
    relatives: Relative[]

    @OneToMany(() => Pool, (pool) => pool.campaign)
    pools: Pool[];

    @ManyToOne(() => User, (user) => user.campaigns)
    @JoinColumn({ name: "user_id" })
    user: User
}
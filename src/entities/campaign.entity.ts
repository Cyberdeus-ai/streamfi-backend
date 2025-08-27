import { Entity, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

import Model from './model.entity';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity()
export class Campaign extends Model
{
    @Column()
    start_date: Date;

    @Column()
    end_date: Date;

    @Column('text')
    hashtags: string;

    @Column('text')
    tickers: string;

    @Column('text')
    handles: string;

    @Column({ type: 'double precision' })
    reward_pool: number;

    @Column('text')
    big_accounts: string;

    @OneToMany(() => Post, (post) => post.campaign)
    posts: Post[];

    @ManyToOne(() => User, (user) => user.campaigns)
    @JoinColumn({ name: "user_id" })
    user: User
}
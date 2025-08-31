import { Entity, Column, OneToOne, JoinColumn } from "typeorm";

import { User } from "./user.entity";

@Entity()
export class XAccount
{
    @Column({ length: 50, primary: true })
    id: string;

    @Column({ length: 50 })
    username: string;

    @Column({ length: 50 })
    name: string;

    @Column({ type: 'int' })
    follower_count: number;

    @Column()
    is_verified: boolean;

    @Column()
    is_blue_verified: boolean;

    @Column({ length: 255 })
    profile_pic_url: string;

    @Column({ type: 'int' })
    number_of_tweets: number;

    @Column()
    bot: boolean

    @Column({ type: 'timestamptz', precision: 3, default: () => `now()` })
    timestamp: Date;

    @OneToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;
}
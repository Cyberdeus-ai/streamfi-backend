import { Column, Entity, JoinColumn, OneToOne } from "typeorm";

import Model from './model.entity';
import { Post } from "./post.entity";

@Entity()
export class Continuation extends Model {
    @OneToOne(() => Post, post => post.continuation)
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @Column({ length: 1000, nullable: true })
    quote_id: string;

    @Column({ length: 1000, nullable: true })
    reply_id: string;

    @Column({ length: 1000, nullable: true })
    retweet_id: string;
};
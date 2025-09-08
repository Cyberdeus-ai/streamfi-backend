import { Column, Entity, JoinColumn, OneToOne } from "typeorm";

import Model from './model.entity';
import { Post } from "./post.entity";

@Entity()
export class Continuation extends Model {
    @OneToOne(() => Post, post => post.continuation)
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @Column({ type: "text", nullable: true })
    quote_id: string;

    @Column({ type: "text", nullable: true })
    reply_id: string;

    @Column({ type: "text", nullable: true })
    retweet_id: string;
};
import { Column, Entity, JoinColumn, OneToOne } from "typeorm";

import Model from './model.entity';
import { Post } from "./post.entity";

@Entity()
export class LastPost extends Model {
    @OneToOne(() => Post, post => post.lastpost)
    @JoinColumn({ name: 'post_id' })
    post: Post;

    @Column({ length: 1000 })
    quote_id: string;

    @Column({ length: 1000 })
    reply_id: string;

    @Column({ length: 1000 })
    retweet_id: string;
};
import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import Model from './model.entity';
import { User } from './user.entity';
import { Post } from './post.entity';

@Entity()
export class Score extends Model
{
    @Column({ type: 'double precision' })
    score: number;

    @ManyToOne(() => User, (user) => user.scores)
    @JoinColumn({ name: "user_id" })
    user: User;

    @ManyToOne(() => Post, (post) => post.scores)
    @JoinColumn({ name: "post_id" })
    post: Post;
}
import { Entity, ManyToOne, OneToMany, JoinColumn, Column } from "typeorm";
import Model from "./model.entity";

import { User } from "./user.entity";
import { Campaign } from "./campaign.entity";

@Entity()
export class Pool extends Model {
    
    @ManyToOne(() => User)
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column({ length: 100, nullable: true})
    token: string;

    @Column({ length: 100, nullable: true})
    super_token_address: string;
    
    @Column({ length: 100, nullable: true })
    address: string;

    @Column({ type: 'float', nullable: true })
    flow_rate: number;

    @Column({ length: 100, nullable: true })
    flow_rate_unit: string;

    @OneToMany(() => Campaign, (campaign) => campaign.pool)
    campaigns: Campaign[];

}
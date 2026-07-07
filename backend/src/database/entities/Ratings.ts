import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { User } from "./User.js";
import { OrderEntity } from "./Order.js";

@Entity("ratings")
@Unique(["raterId", "orderId"])
export class RatingsEntity {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ name: "rater_id", type: "uuid" })
    raterId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "rater_id" })
    rater!: User;

    @Index()
    @Column({ name: "ratee_id", type: "uuid" })
    rateeId!: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "ratee_id" })
    ratee!: User;

    @Index()
    @Column({ name: "order_id", type: "uuid" })
    orderId!: string;

    @ManyToOne(() => OrderEntity)
    @JoinColumn({ name: "order_id" })
    order!: OrderEntity;

    @Column({name:"role_rated", type:"varchar", nullable:false})
    roleRated!: string;

    @Column({name:"score", type:"smallint", nullable:false})
    score!: number;

    @Column({name:"comment", type:"text", nullable:true})
    comment!: string | null;
    
    @CreateDateColumn({ name: "created_at" })
    createdAt!: Date;
}
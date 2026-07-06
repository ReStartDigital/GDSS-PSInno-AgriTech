import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.js";
import { ProduceListingEntity } from "./ProduceListing.js";
import { OrderStatus } from "../../common/constants/roles.enums.js";

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  quantityOrdered: number;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  totalAmount: number; // In GHS

  @Column({
    type: "enum",
    enum: OrderStatus,
    default: OrderStatus.PENDING_PAYMENT,
  })
  status: OrderStatus;

  @Column({
    type: "varchar",
    length: 255,
    name: "delivery_address",
    nullable: true,
  })
  deliveryAddress: string | null;

  @Column({ type: "uuid", name: "trader_id" })
  traderId: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "trader_id" })
  trader: User;

  @Column({ type: "uuid", name: "listing_id" })
  listingId: string;

  @ManyToOne(() => ProduceListingEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "listing_id" })
  listing: ProduceListingEntity;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.js";
import { Order } from "./Order.js";
import {
  TransactionType,
  TransactionStatus,
} from "../../common/constants/enums.js";

@Entity("transactions")
export class Transaction {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column({
    type: "enum",
    enum: TransactionStatus,
    default: TransactionStatus.PENDING,
  })
  status: TransactionStatus;

  // 🔑 Crucial for Paystack synchronization hook matching
  @Column({
    type: "varchar",
    length: 100,
    unique: true,
    name: "paystack_reference",
    nullable: true,
  })
  paystackReference: string | null;

  @Column({
    type: "varchar",
    length: 50,
    name: "payment_method",
    default: "mobile_money",
  })
  paymentMethod: string; // mtn, telecel, airteltigo, card

  @Column({ type: "uuid", name: "user_id" })
  userId: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "uuid", name: "order_id", nullable: true })
  orderId: string | null;

  @ManyToOne(() => Order, { onDelete: "SET NULL" })
  @JoinColumn({ name: "order_id" })
  order: Order | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}

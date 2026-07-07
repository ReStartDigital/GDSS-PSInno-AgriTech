import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";
import { User } from "./User.js";
import { ProduceListingEntity } from "./ProduceListing.js";
import { PackagingOptionEntity } from "./PackagingOptions.js";
import {
  OrderStatus,
  FulfilmentMode,
} from "../../common/constants/roles.enums.js";

/** Statuses considered "active" — block listing deletion and price/qty edits */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PENDING_AGENT_CONFIRMATION,
  OrderStatus.PENDING_SMS_CONFIRMATION,
  OrderStatus.NEGOTIATING,
  OrderStatus.CONFIRMED,
  OrderStatus.PACKED,
  OrderStatus.IN_TRANSIT,
];

@Entity("orders")
export class OrderEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "buyer_id", type: "uuid" })
  buyerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "buyer_id" })
  buyer!: User;

  @Index()
  @Column({ name: "farmer_id", type: "uuid" })
  farmerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "farmer_id" })
  farmer!: User;

  @Index()
  @Column({ name: "listing_id", type: "uuid" })
  listingId!: string;

  @ManyToOne(() => ProduceListingEntity)
  @JoinColumn({ name: "listing_id" })
  listing!: ProduceListingEntity;

  @Column({
    name: "mode",
    type: "enum",
    enum: FulfilmentMode,
    default: FulfilmentMode.DELIVERY,
  })
  mode!: FulfilmentMode;

  @Column({ name: "quantity_kg", type: "numeric", precision: 10, scale: 2 })
  quantityKg!: number;

  @Column({
    name: "price_per_kg_ghs",
    type: "numeric",
    precision: 10,
    scale: 2,
  })
  pricePerKgGhs!: number;

  @Column({
    name: "negotiated_price_per_kg_ghs",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  negotiatedPricePerKgGhs!: number | null;

  @Column({
    name: "produce_subtotal_ghs",
    type: "numeric",
    precision: 12,
    scale: 2,
  })
  produceSubtotalGhs!: number;

  @Column({ name: "packaging_type_id", type: "uuid", nullable: true })
  packagingTypeId!: string | null;

  @ManyToOne(() => PackagingOptionEntity, { nullable: true })
  @JoinColumn({ name: "packaging_type_id" })
  packagingType!: PackagingOptionEntity | null;

  @Column({
    name: "transport_cost_estimate_ghs",
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
  })
  transportCostEstimateGhs!: number;

  @Column({ name: "total_ghs", type: "numeric", precision: 12, scale: 2 })
  totalGhs!: number;

  @Column({ name: "delivery_address", type: "text", nullable: true })
  deliveryAddress!: string | null;

  @Column({
    name: "delivery_location",
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  deliveryLocation!: object | null;

  @Index()
  @Column({ type: "varchar", length: 40, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ name: "cancelled_by", type: "uuid", nullable: true })
  cancelledBy!: string | null;

  @Column({ name: "cancellation_reason", type: "text", nullable: true })
  cancellationReason!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

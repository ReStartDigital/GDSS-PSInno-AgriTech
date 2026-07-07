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
import { PackagingOptionEntity } from "./PackagingOptions.js";

export enum ListingStatus {
  ACTIVE = "active",
  SOLD = "sold",
  CANCELLED = "cancelled",
}

@Entity("produce_listings")
export class ProduceListingEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "farmer_id", type: "uuid" })
  farmerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "farmer_id" })
  farmer!: User;

  @Index()
  @Column({ name: "vegetable_type", type: "varchar", length: 100 })
  vegetableType!: string;

  @Column({ name: "quantity_kg", type: "numeric", precision: 10, scale: 2 })
  quantityKg!: number;

  @Column({
    name: "price_per_kg_ghs",
    type: "numeric",
    precision: 10,
    scale: 2,
  })
  pricePerKgGhs!: number;

  @Column({ name: "harvest_date", type: "date" })
  harvestDate!: string;

  /** Cloudinary URLs stored as a JSONB array */
  @Column({ type: "jsonb", default: "[]" })
  images!: string[];

  @Column({ name: "recommended_packaging_id", type: "uuid", nullable: true })
  recommendedPackagingId!: string | null;

  @ManyToOne(() => PackagingOptionEntity, { nullable: true })
  @JoinColumn({ name: "recommended_packaging_id" })
  recommendedPackaging!: PackagingOptionEntity | null;

  /** PostGIS point — longitude first, then latitude (PostGIS convention) */
  @Column({ type: "geometry", spatialFeatureType: "Point", srid: 4326 })
  location!: { type: "Point"; coordinates: [number, number] };

  @Index()
  @Column({ type: "enum", enum: ListingStatus, default: ListingStatus.ACTIVE })
  status!: ListingStatus;

  // Pre-authorisation fields (Option 2 — farmer order confirmation)
  @Column({
    name: "auto_confirm_until_kg",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  autoConfirmUntilKg!: number | null;

  @Column({
    name: "auto_confirm_price_floor_ghs",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  autoConfirmPriceFloorGhs!: number | null;

  @Column({
    name: "committed_kg",
    type: "numeric",
    precision: 10,
    scale: 2,
    default: 0,
  })
  committedKg!: number;

  // Fulfilment mode flags
  @Column({ name: "supports_delivery", type: "boolean", default: true })
  supportsDelivery!: boolean;

  @Column({ name: "supports_pickup", type: "boolean", default: true })
  supportsPickup!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

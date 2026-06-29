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
import { ListingStatus } from "../../common/constants/enums.js";

@Entity("produce_listings")
export class ProduceListing {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  cropName: string; // e.g., "Yam", "White Maize", "Cassava"

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ type: "numeric", precision: 10, scale: 2 })
  pricePerUnit: number; // e.g., 450.00 GHS

  @Column({ type: "varchar", length: 50 })
  unitOfMeasure: string; // e.g., "100kg Bag", "Crate", "Tonne"

  @Column({ type: "numeric", precision: 10, scale: 2 })
  availableQuantity: number;

  @Column({
    type: "enum",
    enum: ListingStatus,
    default: ListingStatus.AVAILABLE,
  })
  status: ListingStatus;

  @Column({ type: "text", array: true, nullable: true })
  imageUrls: string[] | null; // Array of image links showcasing the produce

  // 🌍 Exactly where the farm produce is located for aggregate pickups
  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
  })
  pickupLocation: string;

  @Column({ type: "uuid", name: "farmer_id" })
  farmerId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "farmer_id" })
  farmer: User;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}

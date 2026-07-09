import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "./User.js";
import { OrderEntity } from "./Order.js";
import { TransportStatus } from "../../common/constants/roles.enums.js";
// Explicitly match your Postgres ENUM type mapping

// Representing GeoJSON geometry signatures within TypeScript interfaces
export interface PointGeometry {
  type: "Point";
  coordinates: [number, number]; // [longitude, latitude]
}

@Entity("transport_requests")
@Index("idx_transport_pickup", ["pickupLocation"], { spatial: true })
export class TransportRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "order_id", type: "uuid", unique: true })
  orderId!: string;

  @OneToOne(() => OrderEntity)
  @JoinColumn({ name: "order_id" })
  order!: OrderEntity;

  @Column({ name: "transporter_id", type: "uuid", nullable: true })
  transporterId!: string | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: "transporter_id" })
  transporter!: User | null;

  @Column({
    name: "pickup_location",
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: false,
  })
  pickupLocation!: PointGeometry;

  @Column({
    name: "dropoff_location",
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: false,
  })
  dropoffLocation!: PointGeometry;

  @Column({
    name: "distance_km",
    type: "numeric",
    precision: 8,
    scale: 2,
    nullable: true,
  })
  distanceKm!: number | null;

  @Column({
    name: "estimated_cost_ghs",
    type: "numeric",
    precision: 10,
    scale: 2,
    nullable: true,
  })
  estimatedCostGhs!: number | null;

  @Column({
    name: "packaging_type_name",
    type: "varchar",
    length: 255,
    nullable: true,
  })
  packagingTypeName!: string | null;

  @Column({ name: "special_handling", type: "text", nullable: true })
  specialHandling!: string | null;

  @Column({
    name: "status",
    type: "enum",
    enum: TransportStatus,
    default: TransportStatus.OPEN,
  })
  @Index("idx_transport_status")
  status!: TransportStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}

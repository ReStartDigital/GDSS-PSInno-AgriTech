import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

// Assuming UserRole enum is imported or defined above
import { UserRole } from "../../common/constants/enums.js";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 20, unique: true })
  phone: string;

  @Column({ type: "varchar", name: "first_name", length: 255 })
  firstName: string;

  @Column({ type: "varchar", name: "middle_name", length: 255, nullable: true, default: null })
  middleName: string | null; // 🔑 Kept string | null to match database nullable state

  @Column({ type: "varchar", name: "last_name", length: 255 })
  lastName: string;

  @Column({ type: "enum", enum: UserRole })
  role: UserRole;

  @Column({ type: "varchar", length: 255, unique: true })
  email: string; // Synthetic email string generated on registration

  @Column({ type: "varchar", name: "pin_hash", length: 255, nullable: true })
  pinHash: string | null;

  @Column({ type: "text", name: "profile_photo_url", nullable: true })
  profilePhotoUrl: string | null;

  // 🌍 PostGIS Location definition mapping
  @Column({
    type: "geometry",
    spatialFeatureType: "Point",
    srid: 4326,
    nullable: true,
  })
  location: string | null; // Handled as GeoJSON string or WKT format in TypeORM

  @Column({ type: "timestamptz", name: "phone_verified_at", nullable: true })
  phoneVerifiedAt: Date | null;

  @Column({ type: "boolean", name: "is_active", default: false })
  isActive: boolean;

  @Column({ type: "timestamptz", name: "deleted_at", nullable: true })
  deletedAt: Date | null;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;
}
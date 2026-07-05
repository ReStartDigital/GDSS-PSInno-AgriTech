import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum ProtectionLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

@Entity("packaging_options")
export class PackagingOptionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "numeric", precision: 8, scale: 2, name: "capacity_kg" })
  capacityKg!: number;

  @Column({
    type: "numeric",
    precision: 10,
    scale: 2,
    name: "cost_per_unit_ghs",
  })
  costPerUnitGhs!: number;

  /** Array of vegetable types this packaging suits. e.g. ['tomatoes','peppers'] */
  @Column({ type: "text", array: true, name: "suitable_for" })
  suitableFor!: string[];

  @Column({ type: "enum", enum: ProtectionLevel, name: "protection_level" })
  protectionLevel!: ProtectionLevel;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({ type: "text", name: "guidelines_text", nullable: true })
  guidelinesText!: string | null;

  @Column({ type: "text", name: "image_url", nullable: true })
  imageUrl!: string | null;

  @Column({ type: "boolean", name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}

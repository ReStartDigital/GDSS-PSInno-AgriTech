import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("refresh_tokens")
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Index()
  @Column({ name: "user_id", type: "uuid" })
  userId!: string;

  @Index({ unique: true })
  @Column({ name: "token_hash", type: "varchar", length: 64 })
  tokenHash!: string;

  @Column({ name: "expires_at", type: "timestamptz" })
  expiresAt!: Date;

  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;

  @Column({ name: "user_agent", type: "text", nullable: true })
  userAgent!: string | null;

  @Column({ name: "ip_address", type: "text", nullable: true })
  ipAddress!: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}

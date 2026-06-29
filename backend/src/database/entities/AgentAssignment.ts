import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.js";

@Entity("agent_assignments")
export class AgentAssignment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "agent_id" })
  agentId: string;

  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "agent_id" })
  agent: User;

  @Column({ type: "uuid", name: "user_id" })
  farmerId: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @CreateDateColumn({ type: "timestamptz", name: "assigned_at" })
  assignedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "unassigned_at" })
  unassignedAt: Date;
}
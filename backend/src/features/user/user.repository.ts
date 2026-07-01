import {
  IsNull,
  Repository,
  type FindOptionsSelect,
  type DataSource,
} from "typeorm";
import { AppDataSource } from "../../config/database.config.js";
import { User } from "../../database/entities/User.js";
import { UserRole } from "../../common/constants/roles.enums.js";
import { AgentAssignment } from "../../database/entities/AgentAssignment.js";
import {
  paginate,
  type PaginatedResult,
  type PaginationParams,
} from "../../common/utils/paginate.util.js";

// Change arrays to column selection boolean flags
const PUBLIC_COLUMNS: FindOptionsSelect<User> = {
  id: true,
  firstName: true,
  middleName: true,
  lastName: true,
  role: true,
  profilePhotoUrl: true,
  location: true,
  isActive: true,
  createdAt: true,
};

const PRIVATE_COLUMNS: FindOptionsSelect<User> = {
  ...PUBLIC_COLUMNS,
  phone: true,
  email: true,
  phoneVerifiedAt: true,
  paymentDetailsSet: true,
  mobileMoneyNumber: true,
  mobileMoneyNetwork: true,
  paystackSubaccountCode: true,
  updatedAt: true,
};

export class UserRepository {
  private user: Repository<User>;
  private assignments: Repository<AgentAssignment>;
  private ds: DataSource;

  constructor() {
    this.ds = AppDataSource;
    this.user = this.ds.getRepository(User);
    this.assignments = this.ds.getRepository(AgentAssignment);
  }

  async findPrivateById(id: string): Promise<User | null> {
    return this.user.findOne({
      where: { id },
      select: PRIVATE_COLUMNS,
    });
  }

  async findPublicById(id: string): Promise<Partial<User> | null> {
    return this.user.findOne({
      where: { id, isActive: true },
      select: PUBLIC_COLUMNS,
    });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.user.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.user.findOne({ where: { id } });
  }

  async createUnverified(params: {
    phone: string;
    firstName: string;
    middleName: string | null | undefined;
    lastName: string;
    role: UserRole;
    email: string;
    location: { type: "Point"; coordinates: [number, number] } | null;
  }): Promise<User> {
    const entity = this.user.create({
      phone: params.phone,
      firstName: params.firstName,
      middleName: params.middleName ?? null,
      lastName: params.lastName,
      role: params.role,
      email: params.email,
      location: params.location ?? null,
      phoneVerifiedAt: null,
      pinHash: null,
      isActive: false,
    });

    return this.user.save(entity);
  }

  async updateUnverifiedDetails(
    id: string,
    params: {
      firstName: string;
      middleName?: string | null | undefined;
      lastName: string;
      role: UserRole;
      email?: string;
      location?: { type: "Point"; coordinates: [number, number] } | null;
    },
  ): Promise<User> {
    await this.user.update(id, {
      firstName: params.firstName,
      middleName: params.middleName ?? null,
      lastName: params.lastName,
      role: params.role,
      ...(params.email && { email: params.email }),
      ...(params.location !== undefined && { location: params.location }),
    });

    const updatedUser = await this.findById(id);
    if (!updatedUser) {
      throw new Error(
        `User row with identifier ${id} lost during state transition updates.`,
      );
    }
    return updatedUser;
  }

  async markPhoneVerified(id: string): Promise<void> {
    await this.user.update(id, { phoneVerifiedAt: new Date() });
  }

  async setPinHash(id: string, pinHash: string): Promise<User> {
    await this.user.update(id, { pinHash, isActive: true });
    const activeUser = await this.findById(id);
    if (!activeUser) {
      throw new Error(
        `User row with identifier ${id} lost during finalization.`,
      );
    }
    return activeUser;
  }

  async deleteStaleUnverified(olderThan: Date): Promise<number> {
    const result = await this.user
      .createQueryBuilder()
      .delete()
      .where("phone_verified_at IS NULL")
      .andWhere("created_at < :olderThan", { olderThan })
      .execute();
    return result.affected ?? 0;
  }

  async updatePinHash(id: string, pinHash: string): Promise<void> {
    await this.user.update(id, { pinHash });
  }

  async updatePaymentDetails(
    id: string,
    params: {
      mobileMoneyNumber: string;
      mobileMoneyNetwork: string;
      paystackSubaccountCode: string;
    },
  ): Promise<void> {
    await this.user.update(id, {
      mobileMoneyNumber: params.mobileMoneyNumber,
      mobileMoneyNetwork: params.mobileMoneyNetwork,
      paystackSubaccountCode: params.paystackSubaccountCode,
      paymentDetailsSet: true,
    });
  }

  async getEarningsSummary(userId: string): Promise<{
    totalEarned: string;
    pendingSettlement: string;
    settled: string;
    thisMonth: string;
    thisWeek: string;
  }> {
    const result = await this.ds.query(
      `SELECT
        COALESCE(SUM(
          CASE WHEN o.farmer_id = $1 THEN p.farmer_share_ghs
               WHEN tr.transporter_id = $1 THEN p.transporter_share_ghs
               ELSE 0 END
        ), 0) AS "totalEarned",
        COALESCE(SUM(
          CASE WHEN (o.farmer_id = $1 OR tr.transporter_id = $1)
                AND o.payment_released_at IS NOT NULL
                AND o.payment_settled_at IS NULL
                THEN COALESCE(p.farmer_share_ghs, p.transporter_share_ghs, 0)
               ELSE 0 END
        ), 0) AS "pendingSettlement",
        COALESCE(SUM(
          CASE WHEN (o.farmer_id = $1 OR tr.transporter_id = $1)
                AND o.payment_settled_at IS NOT NULL
                THEN COALESCE(p.farmer_share_ghs, p.transporter_share_ghs, 0)
               ELSE 0 END
        ), 0) AS "settled",
        COALESCE(SUM(
          CASE WHEN (o.farmer_id = $1 OR tr.transporter_id = $1)
                AND o.payment_settled_at >= date_trunc('month', NOW())
                THEN COALESCE(p.farmer_share_ghs, p.transporter_share_ghs, 0)
               ELSE 0 END
        ), 0) AS "thisMonth",
        COALESCE(SUM(
          CASE WHEN (o.farmer_id = $1 OR tr.transporter_id = $1)
                AND o.payment_settled_at >= date_trunc('week', NOW())
                THEN COALESCE(p.farmer_share_ghs, p.transporter_share_ghs, 0)
               ELSE 0 END
        ), 0) AS "thisWeek"
      FROM orders o
      JOIN payments p ON p.order_id = o.id
      LEFT JOIN transport_requests tr ON tr.order_id = o.id
      WHERE (o.farmer_id = $1 OR tr.transporter_id = $1)
        AND p.status = 'success'`,
      [userId],
    );
    return result[0];
  }

  async getAverageRating(
    userId: string,
  ): Promise<{ averageRating: string; totalRatings: string }> {
    const result = await this.ds.query(
      `SELECT
        ROUND(AVG(score)::numeric, 2)::text AS "averageRating",
        COUNT(*)::text                      AS "totalRatings"
       FROM ratings
       WHERE ratee_id = $1`,
      [userId],
    );
    return {
      averageRating: result[0]?.averageRating ?? "0",
      totalRatings: result[0]?.totalRatings ?? "0",
    };
  }

  async findActiveAgentForUser(
    userId: string,
  ): Promise<AgentAssignment | null> {
    return this.assignments.findOne({
      where: { userId, unassignedAt: IsNull() },
      relations: { agent: true },
    });
  }

  async hasActiveAgent(userId: string): Promise<boolean> {
    const count = await this.assignments.count({
      where: { userId, unassignedAt: IsNull() },
    });
    return count > 0;
  }

  async createAgentAssignment(
    agentId: string,
    userId: string,
  ): Promise<AgentAssignment> {
    const entity = this.assignments.create({
      agentId,
      userId,
      assignedAt: new Date(),
      unassignedAt: null,
    });
    return this.assignments.save(entity);
  }

  async unassignClient(assignmentId: string): Promise<void> {
    await this.assignments.update(assignmentId, { unassignedAt: new Date() });
  }

  async findAgentClients(
    agentId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<User>> {
    const qb = this.user
      .createQueryBuilder("u")
      .innerJoin(
        AgentAssignment,
        "aa",
        "aa.user_id = u.id AND aa.agent_id = :agentId AND aa.unassigned_at IS NULL",
        { agentId },
      )
      .select([
        "u.id",
        "u.firstName",
        "u.middleName",
        "u.lastName",
        "u.phone",
        "u.role",
        "u.profilePhotoUrl",
        "u.isActive",
        "u.createdAt",
      ])
      .orderBy("u.firstName", "ASC"); // Corrected string mapping references

    return paginate(qb, pagination);
  }

  async findAssignmentByAgentAndUser(
    agentId: string,
    userId: string,
  ): Promise<AgentAssignment | null> {
    return this.assignments.findOne({
      where: { agentId, userId, unassignedAt: IsNull() },
    });
  }
}

export const userRepository = new UserRepository();

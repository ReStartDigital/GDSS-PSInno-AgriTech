import { Repository } from "typeorm";
import { AppDataSource } from "../../config/database.config.js";
import { User } from "../../database/entities/User.js";
import { UserRole } from "../../common/constants/roles.enums.js";

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.repo.findOne({ where: { phone } });
  }

  async findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }

  /** Creates an unverified user row — Step 1 of registration. */
  async createUnverified(params: {
    phone: string;
    firstName: string;
    middleName: string | null | undefined;
    lastName: string;
    role: UserRole;
    email: string;
    location: { type: "Point"; coordinates: [number, number] } | null;
  }): Promise<User> {
    const entity = this.repo.create({
      phone: params.phone,
      firstName: params.firstName,
      middleName: params.middleName ?? null,
      lastName: params.lastName,
      role: params.role,
      email: params.email,
      location: params.location ?? null, // Accepts the formatted raw "POINT(lng lat)" string
      phoneVerifiedAt: null,
      pinHash: null,
      isActive: false, // Remains false until step 3 credentials are typed and completed
    });

    return this.repo.save(entity);
  }

  /** Updates name details/role on a retry of an incomplete registration. */
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
    await this.repo.update(id, {
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
    await this.repo.update(id, {
      phoneVerifiedAt: new Date(),
    });
  }

  async setPinHash(id: string, pinHash: string): Promise<User> {
    await this.repo.update(id, {
      pinHash,
      isActive: true, // User account is now officially active and ready to log in
    });

    const activeUser = await this.findById(id);
    if (!activeUser) {
      throw new Error(
        `User row with identifier ${id} lost during finalization.`,
      );
    }
    return activeUser;
  }

  /** Used by the background cleanup job to sweep incomplete profiles. */
  async deleteStaleUnverified(olderThan: Date): Promise<number> {
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where("phone_verified_at IS NULL") // Tailored to align with your date tracer field tracking
      .andWhere("created_at < :olderThan", { olderThan })
      .execute();
    return result.affected ?? 0;
  }
}

export const userRepository = new UserRepository();

import { Repository } from "typeorm";
import { AppDataSource } from "../../config/database.config.js";
import { RefreshTokenEntity } from "../../database/entities/RefreshToken.js";
import { sha256 } from "../../common/utils/hash.util.js";
import { AUTH_CONSTANTS } from "../../common/constants/auth.constants.js";

export class RefreshTokenRepository {
  private repo: Repository<RefreshTokenEntity>;

  constructor() {
    this.repo = AppDataSource.getRepository(RefreshTokenEntity);
  }

  /** Stores a new refresh token as its SHA-256 hash — never the raw value. */
  async create(userId: string, rawToken: string): Promise<RefreshTokenEntity> {
    const entity = this.repo.create({
      userId,
      tokenHash: sha256(rawToken),
      expiresAt: new Date(
        Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN.EXPIRY_SECONDS * 1000,
      ),
    });
    return this.repo.save(entity);
  }

  /** Looks up an active (non-revoked, non-expired) token by its raw value. */
  async findActiveByRawToken(
    rawToken: string,
  ): Promise<RefreshTokenEntity | null> {
    return this.repo.findOne({
      where: { tokenHash: sha256(rawToken) },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.repo.update(id, { revokedAt: new Date() });
  }

  /** Theft-detection response: revoke every active token for this user. */
  async revokeAllForUser(userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ revokedAt: new Date() })
      .where("user_id = :userId", { userId })
      .andWhere("revoked_at IS NULL")
      .execute();
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();

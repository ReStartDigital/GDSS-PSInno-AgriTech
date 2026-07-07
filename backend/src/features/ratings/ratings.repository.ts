/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource, Repository } from "typeorm";
import { RatingsEntity } from "../../database/entities/Ratings.js";
import { User } from "../../database/entities/User.js";
import { AppDataSource } from "../../config/database.config.js";

export class RatingsRepository {
  private repo: Repository<RatingsEntity>;
  private ds: DataSource;


  constructor() {
    this.ds = AppDataSource;
    this.repo = this.ds.getRepository(RatingsEntity);
  }

  /**
   * Saves a new rating and updates the ratee's aggregate calculations atomized in a transaction
   */
  async createAndAggregate(
    data: Partial<RatingsEntity>,
  ): Promise<RatingsEntity> {
    return await this.ds.transaction(async (manager) => {
      const txRatingsRepo = manager.getRepository(RatingsEntity);
      const txUserRepo = manager.getRepository(User);

      // 1. Persist the raw rating record
      const rating = txRatingsRepo.create(data);
      const savedRating = await txRatingsRepo.save(rating);

      // 2. Recalculate average score and total count for the ratee
      const stats = await txRatingsRepo
        .createQueryBuilder("rating")
        .select("AVG(rating.score)", "average")
        .addSelect("COUNT(rating.id)", "count")
        .where("rating.ratee_id = :rateeId", { rateeId: data.rateeId })
        .getRawOne<{ average: string; count: string }>();

      const newAverage = stats?.average
        ? parseFloat(stats.average)
        : Number(data.score);
      const newCount = stats?.count ? parseInt(stats.count, 10) : 1;

      // 3. Update the User profile table (assuming your User entity has these columns)
      await txUserRepo.update(data.rateeId!, {
        ratingAverage: newAverage,
        ratingCount: newCount,
      } as any);

      return savedRating;
    });
  }

  /**
   * Fetches paginated ratings depending on whether they were given or received
   */
  async findPaginated(
    userId: string,
    direction: "given" | "received",
    limit: number,
    offset: number,
  ): Promise<{ ratings: RatingsEntity[]; total: number }> {
    const whereCondition =
      direction === "given" ? { raterId: userId } : { rateeId: userId };

    const [ratings, total] = await this.repo.findAndCount({
      where: whereCondition,
      relations: {
        rater: true,
        ratee: true,
        order: true,
      },
      order: { createdAt: "DESC" },
      take: limit,
      skip: offset,
    });

    return { ratings, total };
  }
}

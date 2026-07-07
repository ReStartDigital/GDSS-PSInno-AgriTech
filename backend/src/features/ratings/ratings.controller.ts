import type { NextFunction, Request, Response } from "express";
import { RatingsRepository } from "./ratings.repository.js";
import { RatingsService } from "./ratings.service.js";
import {
  createRatingSchema,
  getRatingsQuerySchema,
} from "./ratings.schemas.js";

export class RatingsController {
  private ratingsRepo;
  // Update your constructor to accept the service layer instead of the repo
  constructor(private ratingsService: RatingsService) {
    this.ratingsRepo = new RatingsRepository();
  }

  submitReview = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const raterId = req.user!.sub;
      const payload = createRatingSchema.parse(req.body);

      const review = await this.ratingsService.submitTransactionReview(
        raterId,
        payload,
      );

      res.status(201).json({
        success: true,
        message:
          "Review recorded and aggregate rating metrics successfully synchronized.",
        data: review,
      });
    } catch (error) {
      next(error);
    }
  };

  getMyReviews = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const { page, limit, direction } = getRatingsQuerySchema.parse(req.query);
      const offset = (page - 1) * limit;

      const { ratings, total } = await this.ratingsRepo.findPaginated(
        userId,
        direction,
        limit,
        offset,
      );

      // Sanitize out private profile data elements before delivering payload
      const sanitizedData = ratings.map((r) => ({
        id: r.id,
        score: r.score,
        comment: r.comment,
        role_rated: r.roleRated,
        created_at: r.createdAt,
        partner:
          direction === "given"
            ? {
                id: r.ratee.id,
                name: `${r.ratee.firstName} ${r.ratee.lastName}`,
              }
            : {
                id: r.rater.id,
                name: `${r.rater.firstName} ${r.rater.lastName}`,
              },
      }));

      res.status(200).json({
        success: true,
        meta: {
          total_records: total,
          current_page: page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
        data: sanitizedData,
      });
    } catch (error) {
      next(error);
    }
  };
}

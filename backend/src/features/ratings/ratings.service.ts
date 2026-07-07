/* eslint-disable @typescript-eslint/no-explicit-any */
import { RatingsRepository } from './ratings.repository.js';
import { OrdersService } from '../orders/orders.service.js';
import type { CreateRatingDto, GetRatingsQueryDto } from './ratings.schemas.js';
import { BadRequestException, ConflictException } from '../../common/exceptions/index.js';
import { ErrorCode } from '../../common/constants/error-codes.enum.js';
import { RatingsEntity } from '../../database/entities/Ratings.js';
import { OrderStatus } from '../../common/constants/roles.enums.js';

export class RatingsService {
  constructor(
    private ratingsRepo: RatingsRepository,
    private ordersService: OrdersService
  ) {}

  /**
   * Orchestrates business rules, state validations, and role derivation before posting a review
   */
  async submitTransactionReview(raterId: string, dto: CreateRatingDto): Promise<RatingsEntity> {
    // 1. Verify order context and access rights via existing party assertions
    const order = await this.ordersService.getOrderDetailsForParty(dto.order_id, raterId);
    
    // 2. Enforce that reviews can only be created for completed transactions
    if (order.status !== OrderStatus.DELIVERED && OrderStatus.COLLECTED) {
      throw new BadRequestException(
        `Cannot submit feedback. Order status must be DELIVERED or COLLECTED (Current: ${order.status}).`, 
        ErrorCode.BAD_REQUEST
      );
    }

    // 3. Derive the exact market role matching the recipient on the server side
    let roleRated: string;
    if (dto.ratee_id === order.farmerId) {
      roleRated = 'farmer';
    } else if (dto.ratee_id === order.buyerId) {
      roleRated = 'buyer';
    } else {
      throw new BadRequestException(
        'The specified target profile is not an active participant of this order contract.', 
        ErrorCode.BAD_REQUEST
      );
    }

    // 4. Delegate to repository to commit data and update profile averages atomically
    try {
      return await this.ratingsRepo.createAndAggregate({
        raterId,
        rateeId: dto.ratee_id,
        orderId: dto.order_id,
        score: dto.score,
        comment: dto.comment ?? null,
        roleRated,
      });
    } catch (dbError: any) {
      // Catch PostgreSQL unique constraint violations (23505) to block duplicate reviews
      if (dbError.code === '23505') {
        throw new ConflictException(
          'A transaction review has already been logged by your profile for this order sequence.', 
          ErrorCode.RATING_ALREADY_EXISTS
        );
      }
      throw dbError;
    }
  }

  /**
   * Coordinates paginated delivery filters for given/received profile reviews
   */
  async getUserReviewFeed(
    userId: string, 
    query: GetRatingsQueryDto
  ): Promise<{ ratings: RatingsEntity[]; total: number }> {
    const offset = (query.page - 1) * query.limit;
    return this.ratingsRepo.findPaginated(userId, query.direction, query.limit, offset);
  }
}
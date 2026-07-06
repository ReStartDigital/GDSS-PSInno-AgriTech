import { listingsRepository as defaultListingsRepository } from './listings.repository.js';
import { cloudinaryClient } from '../../infrastructure/cloudinary/cloudinary.client.js';
import { UserRole } from '../../common/constants/roles.enums.js';
import { ErrorCode } from '../../common/constants/error-codes.enum.js';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  UnprocessableException,
} from '../../common/exceptions/index.js';
import { logger } from '../../common/utils/logger.js';
import { userRepository } from '../user/user.repository.js';
import type {
  CreateListingDto,
  UpdateListingDto,
  ListingsQueryDto,
  PackagingRecommendDto,
} from './listings.schema.js';
import type { PaginatedResult } from '../../common/utils/paginate.util.js';
import type { ProduceListingEntity } from '../../database/entities/ProduceListingEntity.js';
import type { PackagingOptionEntity } from '../../database/entities/PackagingOptions.js';
import type { AccessTokenPayload } from '../../common/types/express.js';

export class ListingsService {
  private repo: typeof defaultListingsRepository;

  constructor(repo = defaultListingsRepository) {
    this.repo = repo;
  }

  // ── GET /listings ─────────────────────────────────────────────────────────

  async browse(query: ListingsQueryDto): Promise<PaginatedResult<ProduceListingEntity>> {
    return this.repo.findAll(query);
  }

  // ── GET /listings/:id ─────────────────────────────────────────────────────

  async getById(id: string): Promise<ProduceListingEntity> {
    const listing = await this.repo.findById(id);
    if (!listing) {
      throw new NotFoundException('Listing not found');
    }
    return listing;
  }

  // ── POST /listings ────────────────────────────────────────────────────────

  async create(caller: AccessTokenPayload, dto: CreateListingDto): Promise<ProduceListingEntity> {
    let farmerId: string;

    if (caller.role === UserRole.AGENT) {
      // Agents must supply a farmer_id pointing to one of their clients.
      if (!dto.farmer_id) {
        throw new UnprocessableException(
          'Agents must supply farmer_id when creating a listing on behalf of a farmer.',
          ErrorCode.LISTING_FORBIDDEN,
        );
      }
      await this.assertAgentOwnsClient(caller.sub, dto.farmer_id);
      farmerId = dto.farmer_id;
    } else if (caller.role === UserRole.FARMER) {
      farmerId = caller.sub;
    } else {
      throw new ForbiddenException('Only farmers and agents can create listings.');
    }

    // Validate packaging option exists if provided
    if (dto.recommended_packaging_id) {
      const pkg = await this.repo.findPackagingById(dto.recommended_packaging_id);
      if (!pkg) {
        throw new NotFoundException('Packaging option not found or is no longer active');
      }
    }

    const listing = await this.repo.create({
      farmerId,
      vegetableType: dto.vegetable_type,
      quantityKg: dto.quantity_kg,
      pricePerKgGhs: dto.price_per_kg_ghs,
      harvestDate: dto.harvest_date,
      images: dto.images,
      recommendedPackagingId: dto.recommended_packaging_id ?? null,
      lat: dto.location.lat,
      lng: dto.location.lng,
      supportsDelivery: dto.supports_delivery,
      supportsPickup: dto.supports_pickup,
      autoConfirmUntilKg: dto.auto_confirm_until_kg ?? null,
      autoConfirmPriceFloorGhs: dto.auto_confirm_price_floor_ghs ?? null,
    });

    logger.info('Listing created', {
      listingId: listing.id,
      farmerId,
      vegetableType: dto.vegetable_type,
      createdBy: caller.sub,
    });

    return listing;
  }

  // ── PATCH /listings/:id ───────────────────────────────────────────────────

  async update(
    caller: AccessTokenPayload,
    listingId: string,
    dto: UpdateListingDto,
  ): Promise<ProduceListingEntity> {
    const listing = await this.repo.findById(listingId);
    if (!listing) throw new NotFoundException('Listing not found');

    await this.assertCallerOwnsListing(caller, listing);

    // Block price/quantity changes if there are active orders on this listing
    const priceOrQtyChanged = dto.quantity_kg !== undefined || dto.price_per_kg_ghs !== undefined;
    if (priceOrQtyChanged) {
      const hasActive = await this.repo.hasActiveOrders(listingId);
      if (hasActive) {
        throw new ConflictException(
          'Cannot update quantity or price while an active order exists on this listing.',
          ErrorCode.LISTING_HAS_ACTIVE_ORDER,
        );
      }
    }

    // Validate new packaging option if provided
    if (dto.recommended_packaging_id !== undefined && dto.recommended_packaging_id !== null) {
      const pkg = await this.repo.findPackagingById(dto.recommended_packaging_id);
      if (!pkg) throw new NotFoundException('Packaging option not found or is no longer active');
    }

    // Validate that at least one fulfilment mode remains enabled after update
    const willSupportDelivery = dto.supports_delivery ?? listing.supportsDelivery;
    const willSupportPickup   = dto.supports_pickup   ?? listing.supportsPickup;
    if (!willSupportDelivery && !willSupportPickup) {
      throw new UnprocessableException(
        'At least one of supports_delivery or supports_pickup must remain true.',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    // Remove undefined values to satisfy exactOptionalPropertyTypes
    const updatePayload = {
      vegetableType: dto.vegetable_type,
      quantityKg: dto.quantity_kg,
      pricePerKgGhs: dto.price_per_kg_ghs,
      harvestDate: dto.harvest_date,
      images: dto.images,
      recommendedPackagingId: dto.recommended_packaging_id,
      lat: dto.location?.lat,
      lng: dto.location?.lng,
      status: dto.status as ProduceListingEntity['status'] | undefined,
      supportsDelivery: dto.supports_delivery,
      supportsPickup: dto.supports_pickup,
      autoConfirmUntilKg: dto.auto_confirm_until_kg,
      autoConfirmPriceFloorGhs: dto.auto_confirm_price_floor_ghs,
    };

    Object.keys(updatePayload).forEach(
      (key) => updatePayload[key as keyof typeof updatePayload] === undefined && delete updatePayload[key as keyof typeof updatePayload]
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await this.repo.update(listingId, updatePayload as any);

    logger.info('Listing updated', { listingId, updatedBy: caller.sub });

    return this.getById(listingId);
  }

  // ── DELETE /listings/:id (soft-delete: status → cancelled) ───────────────

  async remove(caller: AccessTokenPayload, listingId: string): Promise<{ message: string }> {
    const listing = await this.repo.findById(listingId);
    if (!listing) throw new NotFoundException('Listing not found');

    await this.assertCallerOwnsListing(caller, listing);

    const hasActive = await this.repo.hasActiveOrders(listingId);
    if (hasActive) {
      throw new ConflictException(
        'Cannot delete a listing that has an active order. Cancel the order first.',
        ErrorCode.LISTING_HAS_ACTIVE_ORDER,
      );
    }

    await this.repo.update(listingId, { status: 'cancelled' as ProduceListingEntity['status'] });
    logger.info('Listing cancelled', { listingId, cancelledBy: caller.sub });

    return { message: 'Listing cancelled successfully' };
  }

  // ── POST /listings/images — Upload image to Cloudinary ───────────────────

  async uploadImage(
    caller: AccessTokenPayload,
    fileBuffer: Buffer,
  ): Promise<{ url: string; thumbnail_url: string }> {
    if (caller.role !== UserRole.FARMER && caller.role !== UserRole.AGENT) {
      throw new ForbiddenException('Only farmers and agents can upload listing images.');
    }

    const result = await cloudinaryClient.uploadBuffer(
      fileBuffer,
      'vegelink/listings',
      // No deterministic publicId here — each image upload is a new asset.
    );

    if (!result.url) {
      throw new UnprocessableException(
        'Image upload failed. Please try again.',
        ErrorCode.INTERNAL_ERROR,
      );
    }

    logger.debug('Listing image uploaded', { publicId: result.publicId, userId: caller.sub });

    return { url: result.url, thumbnail_url: result.thumbnailUrl ?? result.url };
  }

  // ── GET /listings/packaging/recommend ─────────────────────────────────────

  async recommendPackaging(dto: PackagingRecommendDto): Promise<{
    recommendations: Array<PackagingOptionEntity & { reason: string }>;
  }> {
    const options = await this.repo.recommendPackaging(dto.vegetable_type);
    const recommendations = options.map((opt) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const suitableForArray = opt.suitableFor || (opt as any).suitable_for || [];
      const isExactMatch = suitableForArray.includes(dto.vegetable_type);
      const reason = isExactMatch
        ? `Recommended for ${dto.vegetable_type} — ${opt.protectionLevel} protection, ${opt.capacityKg}kg capacity`
        : `General purpose option — ${opt.protectionLevel} protection, ${opt.capacityKg}kg capacity`;
      return { ...opt, reason };
    });

    return { recommendations };
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  /**
   * Verifies that the calling user has the right to modify a listing.
   * Farmers can only touch their own listings.
   * Agents can touch listings for farmers in their client list.
   */
  private async assertCallerOwnsListing(
    caller: AccessTokenPayload,
    listing: ProduceListingEntity,
  ): Promise<void> {
    if (caller.role === UserRole.FARMER) {
      if (listing.farmerId !== caller.sub) {
        throw new ForbiddenException('You can only modify your own listings.');
      }
      return;
    }

    if (caller.role === UserRole.AGENT) {
      await this.assertAgentOwnsClient(caller.sub, listing.farmerId);
      return;
    }

    throw new ForbiddenException('Only farmers and agents can modify listings.');
  }

  /**
   * Confirms the agent has an active assignment for the target farmer.
   * Throws ForbiddenException if not.
   */
  private async assertAgentOwnsClient(agentId: string, farmerId: string): Promise<void> {
    const assignment = await userRepository.findAssignmentByAgentAndUser(agentId, farmerId);
    if (!assignment) {
      throw new ForbiddenException(
        'You can only manage listings for farmers in your client list.',
      );
    }
  }
}

export const listingsService = new ListingsService();
import { DataSource, Repository } from 'typeorm';
import { AppDataSource } from '../../config/database.config.js';
import { ProduceListing  } from '../../database/entities/ProduceListing.js';
import { ListingStatus } from '../../common/constants/roles.enums.js';
import { PackagingOptionEntity } from '../../database/entities/PackagingOptions.js';
import { paginate, type PaginatedResult } from '../../common/utils/paginate.util.js';
import type { ListingsQueryDto } from './listings.schema.js';

export class ListingsRepository {
  private listings: Repository<ProduceListing>;
  private packaging: Repository<PackagingOptionEntity>;
  private ds: DataSource;

  constructor() {
    this.ds = AppDataSource;
    this.listings = this.ds.getRepository(ProduceListing);
    this.packaging = this.ds.getRepository(PackagingOptionEntity);
  }

  // ── Browse / search ───────────────────────────────────────────────────────

  async findAll(
    query: ListingsQueryDto,
  ): Promise<PaginatedResult<ProduceListing>> {
    const qb = this.listings
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.farmer', 'farmer')
      .leftJoinAndSelect('l.recommendedPackaging', 'packaging')
      .where('l.status = :status', { status: ListingStatus.ACTIVE });

    if (query.vegetable_type) {
      // ilike for case-insensitive partial match
      qb.andWhere('l.vegetable_type ILIKE :veg', { veg: `%${query.vegetable_type}%` });
    }

    if (query.min_price_kg !== undefined) {
      qb.andWhere('l.price_per_kg_ghs >= :minPrice', { minPrice: query.min_price_kg });
    }

    if (query.max_price_kg !== undefined) {
      qb.andWhere('l.price_per_kg_ghs <= :maxPrice', { maxPrice: query.max_price_kg });
    }

    if (query.min_quantity_kg !== undefined) {
      qb.andWhere('l.quantity_kg >= :minQty', { minQty: query.min_quantity_kg });
    }

    if (query.packaging_id) {
      qb.andWhere('l.recommended_packaging_id = :pkgId', { pkgId: query.packaging_id });
    }

    if (query.farmer_id) {
      qb.andWhere('l.farmer_id = :farmerId', { farmerId: query.farmer_id });
    }

    // Fulfilment mode filter
    if (query.fulfilment_mode === 'delivery') {
      qb.andWhere('l.supports_delivery = true');
    } else if (query.fulfilment_mode === 'pickup') {
      qb.andWhere('l.supports_pickup = true');
    }
    // 'both' = no additional filter

    // Geolocation radius filter using PostGIS ST_DWithin
    if (query.lat !== undefined && query.lng !== undefined) {
      const radiusMeters = (query.radius_km ?? 15) * 1000;
      qb.andWhere(
        `ST_DWithin(
          l.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radius
        )`,
        { lat: query.lat, lng: query.lng, radius: radiusMeters },
      );
      // When a location is provided, sort by distance ascending (nearest first)
      qb.addSelect(
        `ST_Distance(
          l.location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        )`,
        'distance_m',
      );
      qb.orderBy('distance_m', 'ASC');
    } else {
      qb.orderBy('l.created_at', 'DESC');
    }

    return paginate(qb, { page: query.page, limit: query.limit });
  }

  // ── Single listing ────────────────────────────────────────────────────────

  async findById(id: string): Promise<ProduceListing | null> {
    return this.listings.findOne({
      where: { id },
      relations: ['farmer', 'recommendedPackaging'],
    });
  }

  async findActiveById(id: string): Promise<ProduceListing | null> {
    return this.listings.findOne({
      where: { id, status: ListingStatus.ACTIVE },
      relations: ['farmer', 'recommendedPackaging'],
    });
  }

  // ── Create ────────────────────────────────────────────────────────────────

  async create(params: {
    farmerId: string;
    vegetableType: string;
    quantityKg: number;
    pricePerKgGhs: number;
    harvestDate: string;
    images: string[];
    recommendedPackagingId: string | null;
    lat: number;
    lng: number;
    supportsDelivery: boolean;
    supportsPickup: boolean;
    autoConfirmUntilKg?: number | null;
    autoConfirmPriceFloorGhs?: number | null;
  }): Promise<ProduceListing> {
    // Location is set via raw query because TypeORM can't construct a
    // PostGIS geometry object from a plain JS object directly.
    const result = await this.ds.query(
      `INSERT INTO produce_listings
        (farmer_id, vegetable_type, quantity_kg, price_per_kg_ghs, harvest_date,
         images, recommended_packaging_id, location,
         supports_delivery, supports_pickup,
         auto_confirm_until_kg, auto_confirm_price_floor_ghs)
       VALUES
        ($1, $2, $3, $4, $5, $6::jsonb, $7,
         ST_SetSRID(ST_MakePoint($8, $9), 4326),
         $10, $11, $12, $13)
       RETURNING id`,
      [
        params.farmerId,
        params.vegetableType,
        params.quantityKg,
        params.pricePerKgGhs,
        params.harvestDate,
        JSON.stringify(params.images),
        params.recommendedPackagingId ?? null,
        params.lng, // PostGIS: longitude first
        params.lat,
        params.supportsDelivery,
        params.supportsPickup,
        params.autoConfirmUntilKg ?? null,
        params.autoConfirmPriceFloorGhs ?? null,
      ],
    );

    return this.findById(result[0].id) as Promise<ProduceListing>;
  }

  // ── Update ────────────────────────────────────────────────────────────────

  async update(
    id: string,
    params: Partial<{
      vegetableType: string;
      quantityKg: number;
      pricePerKgGhs: number;
      harvestDate: string;
      images: string[];
      recommendedPackagingId: string | null;
      lat: number;
      lng: number;
      status: ListingStatus;
      supportsDelivery: boolean;
      supportsPickup: boolean;
      autoConfirmUntilKg: number | null;
      autoConfirmPriceFloorGhs: number | null;
    }>,
  ): Promise<void> {
    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const addField = (col: string, val: unknown) => {
      sets.push(`${col} = $${idx++}`);
      values.push(val);
    };

    if (params.vegetableType !== undefined) addField('vegetable_type', params.vegetableType);
    if (params.quantityKg !== undefined) addField('quantity_kg', params.quantityKg);
    if (params.pricePerKgGhs !== undefined) addField('price_per_kg_ghs', params.pricePerKgGhs);
    if (params.harvestDate !== undefined) addField('harvest_date', params.harvestDate);
    if (params.images !== undefined) addField('images', JSON.stringify(params.images));
    if (params.recommendedPackagingId !== undefined) addField('recommended_packaging_id', params.recommendedPackagingId);
    if (params.status !== undefined) addField('status', params.status);
    if (params.supportsDelivery !== undefined) addField('supports_delivery', params.supportsDelivery);
    if (params.supportsPickup !== undefined) addField('supports_pickup', params.supportsPickup);
    if (params.autoConfirmUntilKg !== undefined) addField('auto_confirm_until_kg', params.autoConfirmUntilKg);
    if (params.autoConfirmPriceFloorGhs !== undefined) addField('auto_confirm_price_floor_ghs', params.autoConfirmPriceFloorGhs);

    // Location requires ST_SetSRID — handled separately if both lat and lng are provided
    if (params.lat !== undefined && params.lng !== undefined) {
      sets.push(`location = ST_SetSRID(ST_MakePoint($${idx++}, $${idx++}), 4326)`);
      values.push(params.lng, params.lat);
    }

    if (sets.length === 0) return;

    sets.push('updated_at = NOW()');
    values.push(id);

    await this.ds.query(
      `UPDATE produce_listings SET ${sets.join(', ')} WHERE id = $${idx}`,
      values,
    );
  }

  // ── Ownership check ───────────────────────────────────────────────────────

  async hasActiveOrders(listingId: string): Promise<boolean> {
    const result = await this.ds.query(
      `SELECT EXISTS(
         SELECT 1 FROM orders
         WHERE listing_id = $1
           AND status NOT IN ('cancelled', 'cancelled_expired', 'delivered', 'collected')
       ) AS has_active`,
      [listingId],
    );
    return result[0]?.has_active === true;
  }

  // ── Packaging catalog ─────────────────────────────────────────────────────

  async findAllActivePackaging(): Promise<PackagingOptionEntity[]> {
    return this.packaging.find({
      where: { isActive: true },
      order: { protectionLevel: 'DESC', name: 'ASC' },
    });
  }

  async findPackagingById(id: string): Promise<PackagingOptionEntity | null> {
    return this.packaging.findOne({ where: { id, isActive: true } });
  }

  /**
   * Returns up to 3 packaging options best suited for the given vegetable type.
   * Matching logic: exact or partial match in the suitable_for text array,
   * ranked by protection_level DESC so the safest option comes first.
   * Falls back to general-purpose options if no exact match found.
   */
  async recommendPackaging(vegetableType: string): Promise<PackagingOptionEntity[]> {
    const exact = await this.ds.query(
      `SELECT * FROM packaging_options
       WHERE is_active = TRUE
         AND $1 = ANY(suitable_for)
       ORDER BY
         CASE protection_level WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END
       LIMIT 3`,
      [vegetableType],
    );

    if (exact.length > 0) return exact;

    // No exact match — return the two highest-protection general options
    return this.ds.query(
      `SELECT * FROM packaging_options
       WHERE is_active = TRUE
       ORDER BY
         CASE protection_level WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END
       LIMIT 2`,
    );
  }
}

export const listingsRepository = new ListingsRepository();
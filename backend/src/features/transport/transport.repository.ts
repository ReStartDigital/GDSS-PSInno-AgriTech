/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource, Repository } from "typeorm";
import { TransportRequestEntity } from "../../database/entities/Transportation.js";
import { TransportStatus } from "../../common/constants/roles.enums.js";

export class TransportRepository {
  private repo: Repository<TransportRequestEntity>;

  constructor(private dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(TransportRequestEntity);
  }

  /**
   * Raw wrapper to instantiate a transport row injecting PostGIS spatial geography details
   */
  async createRequest(data: {
    orderId: string;
    pickupLat: number;
    pickupLng: number;
    dropoffLat: number;
    dropoffLng: number;
    packagingTypeName: string;
    specialHandling?: string | undefined | null;
  }): Promise<TransportRequestEntity> {
    // Calculate an approximate linear distance using PostGIS geography structures
    const distanceResult = await this.dataSource.query(
      `
      SELECT ST_Distance(
        ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
        ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography
      ) / 1000 AS distance_km
    `,
      [data.pickupLng, data.pickupLat, data.dropoffLng, data.dropoffLat],
    );

    const distanceKm = parseFloat(distanceResult[0]?.distance_km || "0");
    // Simple baseline pricing rule: e.g., Base 50 GHS + 8 GHS per KM
    const estimatedCostGhs = 50 + distanceKm * 8;

    const insertResult = await this.dataSource.query(
      `
      INSERT INTO transport_requests (
        order_id, 
        pickup_location, 
        dropoff_location, 
        distance_km, 
        estimated_cost_ghs, 
        packaging_type_name, 
        special_handling, 
        status
      ) VALUES (
        $1, 
        ST_SetSRID(ST_MakePoint($2, $3), 4326), 
        ST_SetSRID(ST_MakePoint($4, $5), 4326), 
        $6, $7, $8, $9, 'open'
      ) RETURNING id;
    `,
      [
        data.orderId,
        data.pickupLng,
        data.pickupLat,
        data.dropoffLng,
        data.dropoffLat,
        distanceKm,
        estimatedCostGhs,
        data.packagingTypeName,
        data.specialHandling || null,
      ],
    );

    return this.repo.findOneByOrFail({ id: insertResult[0].id });
  }

  /**
   * Locates open transport jobs, sorting them by proximity if a driver provides their location coordinates
   */
  async findAvailableJobs(params: {
    limit: number;
    offset: number;
    lat?: number | undefined; // Added '| undefined' here
    lng?: number | undefined; // Added '| undefined' here
    radiusKm: number;
  }): Promise<{ jobs: any[]; total: number }> {
    const queryBuilder = this.repo
      .createQueryBuilder("tr")
      .leftJoinAndSelect("tr.order", "order")
      .leftJoinAndSelect("order.listing", "listing")
      .leftJoinAndSelect("listing.farmer", "farmer")
      .leftJoinAndSelect("order.buyer", "buyer")
      .where("tr.status = :status", { status: TransportStatus.OPEN });

    if (params.lat && params.lng) {
      // Filter within radius bounding circles using PostGIS spatial operators
      queryBuilder.andWhere(
        `
        ST_DWithin(
          tr.pickup_location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
          :radiusMeters
        )
      `,
        {
          lng: params.lng,
          lat: params.lat,
          radiusMeters: params.radiusKm * 1000,
        },
      );

      // Sort with closest pick-up locations showing up first
      queryBuilder.orderBy(
        `
        ST_Distance(
          tr.pickup_location::geography,
          ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        )
      `,
        "ASC",
      );
    } else {
      queryBuilder.orderBy("tr.createdAt", "DESC");
    }

    const [jobs, total] = await Promise.all([
      queryBuilder.take(params.limit).skip(params.offset).getMany(),
      queryBuilder.getCount(),
    ]);

    return { jobs, total };
  }

  /**
   * Locates transport jobs assigned to a specific transporter
   */
  async findMyJobs(params: {
    transporterId: string;
    limit: number;
    offset: number;
  }): Promise<{ jobs: any[]; total: number }> {
    const queryBuilder = this.repo
      .createQueryBuilder("tr")
      .leftJoinAndSelect("tr.order", "order")
      .leftJoinAndSelect("order.listing", "listing")
      .leftJoinAndSelect("listing.farmer", "farmer")
      .leftJoinAndSelect("order.buyer", "buyer")
      .where("tr.transporterId = :transporterId", { transporterId: params.transporterId })
      .orderBy("tr.updatedAt", "DESC");

    const [jobs, total] = await Promise.all([
      queryBuilder.take(params.limit).skip(params.offset).getMany(),
      queryBuilder.getCount(),
    ]);

    return { jobs, total };
  }

  /**
   * Fetch standard query repo instance exposed for transaction operations
   */
  get baseRepo(): Repository<TransportRequestEntity> {
    return this.repo;
  }
}

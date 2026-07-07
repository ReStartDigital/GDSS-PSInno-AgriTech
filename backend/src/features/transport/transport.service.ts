/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataSource } from "typeorm";
import { TransportRepository } from "./transport.repository.js";
import type {
  CreateTransportRequestDto,
  BrowseAvailableJobsDto,
} from "./transport.schemas.js";
import { TransportRequestEntity } from "../../database/entities/Transportation.js";
import {
  OrderStatus,
  TransportStatus,
} from "../../common/constants/roles.enums.js";
import { OrderEntity } from "../../database/entities/Order.js";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../common/exceptions/index.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import { assertValidTransition } from "../orders/order-state-machine.js";

export class TransportService {
  constructor(
    private transportRepo: TransportRepository,
    private dataSource: DataSource,
  ) {}

  async requestHauling(
    dto: CreateTransportRequestDto,
  ): Promise<TransportRequestEntity> {
    const orderRepo = this.dataSource.getRepository(OrderEntity);
    const existingOrder = await orderRepo.findOneBy({ id: dto.order_id });

    if (!existingOrder) {
      throw new NotFoundException(
        "Target order record not found.",
        ErrorCode.ORDER_NOT_FOUND,
      );
    }
    if (existingOrder.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestException(
        "Transport requests can only be initiated for verified paid orders.",
        ErrorCode.BAD_REQUEST,
      );
    }

    try {
      return await this.transportRepo.createRequest({
        orderId: dto.order_id,
        pickupLat: dto.pickup_location.latitude,
        pickupLng: dto.pickup_location.longitude,
        dropoffLat: dto.dropoff_location.latitude,
        dropoffLng: dto.dropoff_location.longitude,
        packagingTypeName: dto.packaging_type_name,
        specialHandling: dto.special_handling,
      });
    } catch (error: any) {
      if (error.code === "23505") {
        throw new ConflictException(
          "A transport contract route entry already exists for this order sequence.",
          ErrorCode.TRANSPORT_ALREADY_EXISTS,
        );
      }
      throw error;
    }
  }

  async browseJobs(
    query: BrowseAvailableJobsDto,
  ): Promise<{ data: any[]; total: number }> {
    const offset = (query.page - 1) * query.limit;
    const { jobs, total } = await this.transportRepo.findAvailableJobs({
      limit: query.limit,
      offset,
      radiusKm: query.radius_km,
      // Only spread these properties into the object if they actually contain numbers
      ...(query.latitude !== undefined && { lat: query.latitude }),
      ...(query.longitude !== undefined && { lng: query.longitude }),
    });
    return {
      data: jobs,
      total,
    };
  }

  async acceptJob(
    requestId: string,
    transporterId: string,
  ): Promise<TransportRequestEntity> {
    return await this.dataSource.transaction(async (manager) => {
      const txTransportRepo = manager.getRepository(TransportRequestEntity);
      const txOrderRepo = manager.getRepository(OrderEntity);

      // Pessimistic Row Locking prevents two drivers from accepting the exact same job row
      const request = await txTransportRepo.findOne({
        where: { id: requestId },
        lock: { mode: "pessimistic_write" },
      });

      if (!request) {
        throw new NotFoundException(
          "Transport assignment profile not found.",
          ErrorCode.NOT_FOUND,
        );
      }
      if (request.status !== TransportStatus.OPEN) {
        throw new ConflictException(
          "This route contract has already been claimed by another carrier.",
          ErrorCode.TRANSPORT_ALREADY_EXISTS,
        );
      }

      // 2. Lock and fetch the associated Order record
      const order = await txOrderRepo.findOne({
        where: { id: request.orderId },
        lock: { mode: "pessimistic_write" },
      });

      if (!order) {
        throw new NotFoundException(
          "Associated order record not found.",
          ErrorCode.ORDER_NOT_FOUND,
        );
      }

      // Define your next intended target state (e.g., transitioning to PACKED)
      const targetStatus = OrderStatus.PACKED;

      // 3. Enforce validation rules against your centralized state machine
      // Throws ConflictException (ORDER_INVALID_TRANSITION) automatically if forbidden
      assertValidTransition(order.status as OrderStatus, targetStatus);

      request.status = TransportStatus.ACCEPTED;
      request.transporterId = transporterId;
      const updatedRequest = await txTransportRepo.save(request);

      // Advance core order state machinery tracking pipelines
      order.status = targetStatus;
      await txOrderRepo.save(order);

      return updatedRequest;
    });
  }
  async confirmSecureDelivery(
    requestId: string,
    transporterId: string,
  ): Promise<TransportRequestEntity> {
    return await this.dataSource.transaction(async (manager) => {
      const txTransportRepo = manager.getRepository(TransportRequestEntity);
      const txOrderRepo = manager.getRepository(OrderEntity);

      // 1. Fetch and lock the transport record to prevent concurrent double-processing
      const request = await txTransportRepo.findOne({
        where: { id: requestId, transporterId },
        lock: { mode: "pessimistic_write" },
      });

      if (!request) {
        throw new NotFoundException(
          "Active transport assignment not found for your carrier profile.",
          ErrorCode.NOT_FOUND,
        );
      }
      if (
        request.status !== TransportStatus.ACCEPTED &&
        request.status !== TransportStatus.IN_TRANSIT
      ) {
        throw new BadRequestException(
          "This delivery contract is not in a valid state to be completed.",
          ErrorCode.BAD_REQUEST,
        );
      }

      // 2. Fetch and lock the Order
      const order = await txOrderRepo.findOne({
        where: { id: request.orderId },
        lock: { mode: "pessimistic_write" },
      });

      if (!order) {
        throw new NotFoundException(
          "Associated order record not found.",
          ErrorCode.ORDER_NOT_FOUND,
        );
      }

      // 3. Delegate Verification directly to your Arkesel API Client Wrapper
      // Replace this inline block with your actual service signature:
      // await this.arkeselService.verifyOtp(order.buyerPhone, dto.verification_pin);
      const isOtpValid = true; // Placeholder for your external Arkesel verification logic execution response

      if (!isOtpValid) {
        throw new BadRequestException(
          "The verification PIN entered does not match Arkesel session records.",
          ErrorCode.BAD_REQUEST,
        );
      }

      // 4. Validate state machine transition (IN_TRANSIT -> DELIVERED)
      const targetOrderStatus = OrderStatus.DELIVERED;
      assertValidTransition(order.status as OrderStatus, targetOrderStatus);

      // 5. Commit mutations atomically
      request.status = TransportStatus.DELIVERED;
      const updatedRequest = await txTransportRepo.save(request);

      order.status = targetOrderStatus;
      await txOrderRepo.save(order);

      // 6. TODO: Dispatch an internal event (e.g., eventBus.emit('payment.release_escrow', order.id))
      // This tells your payment microservice or provider to transfer funds to the farmer and driver.

      return updatedRequest;
    });
  }
}

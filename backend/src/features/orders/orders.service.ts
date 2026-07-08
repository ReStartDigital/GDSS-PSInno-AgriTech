/* eslint-disable @typescript-eslint/no-explicit-any */
import { OrdersRepository } from "./orders.repository.js";
import { ListingsRepository } from "../listings/listings.repository.js";
import { UserRepository } from "../user/user.repository.js";
import type {
  CreateOrderDto,
  NegotiateOrderDto,
  CancelOrderDto,
  DeclineOrderDto,
} from "./orders.schemas.js";
import { OrderEntity } from "../../database/entities/Order.js";
import {
  OrderStatus,
  FulfilmentMode,
} from "../../common/constants/roles.enums.js";
import {
  assertValidTransition,
  resolveInitialStatus,
  resolvePackedNextStatus,
} from "./order-state-machine.js";
import {
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "../../common/exceptions/index.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import { TransportService } from "../transport/transport.service.js";
import { TransportRepository } from "../transport/transport.repository.js";
import { AppDataSource } from "../../config/database.config.js";
import type { DataSource } from "typeorm";
import { ProduceListingEntity } from "../../database/entities/ProduceListing.js";
import { User } from "../../database/entities/User.js";
import { arkeselClient } from "../../infrastructure/arkesel/arkesel.client.js";

export class OrdersService {
  private transportService;
  private transportRepo;
  constructor(
    private ordersRepo: OrdersRepository,
    private listingsRepo: ListingsRepository,
    private usersRepo: UserRepository,
    private dataSource: DataSource,
  ) {
    this.transportRepo = new TransportRepository(AppDataSource);
    this.transportService = new TransportService(
      this.transportRepo,
      AppDataSource,
    );
  }

  /**
   * Places a new order and runs core pricing calculus
   */
  async createOrder(
    buyerId: string,
    dto: CreateOrderDto,
  ): Promise<OrderEntity> {
    // We execute the entire lifecycle inside a managed database transaction closure
    return await this.dataSource.transaction(async (manager) => {
      // Use transactional managers instead of global unsynced repositories
      const txListingsRepo = manager.getRepository(ProduceListingEntity);
      const txUsersRepo = manager.getRepository(User);
      const txOrdersRepo = manager.getRepository(OrderEntity);

      // 1. Fetch the produce listing with a write lock to ensure stock doesn't shift mid-flight
      const listing = await txListingsRepo.findOne({
        where: { id: dto.listing_id },
        lock: { mode: "pessimistic_write" },
      });

      if (!listing || listing.status !== "active") {
        throw new NotFoundException(
          "Listing not found or no longer active",
          ErrorCode.LISTING_NOT_ACTIVE_FOR_ORDER,
        );
      }

      // 2. Prevent farmers from buying their own items
      if (listing.farmerId === buyerId) {
        throw new BadRequestException(
          "You cannot purchase your own produce listing",
          ErrorCode.ORDER_FORBIDDEN,
        );
      }

      // 3. Check stock capacity
      const requestedQty = dto.quantity_kg;
      const availableStock =
        Number(listing.quantityKg) - Number(listing.committedKg || 0);

      if (requestedQty > availableStock) {
        throw new BadRequestException(
          `Requested quantity exceeds available stock (${availableStock}kg remaining)`,
          ErrorCode.QUANTITY_EXCEEDS_AVAILABLE,
        );
      }

      // 4. Resolve the farmer context and location markers
      const farmer = await txUsersRepo.findOneBy({ id: listing.farmerId });
      if (!farmer) {
        throw new NotFoundException(
          "Farmer account record not found",
          ErrorCode.ORDER_FORBIDDEN,
        );
      }

      // 5. Billing Calculus
      const pricePerKg = Number(listing.pricePerKgGhs);
      const produceSubtotal = requestedQty * pricePerKg;

      // In a future sprint, this can be linked up directly to the PostGIS calculation tool
      const transportCostEstimate =
        dto.mode === FulfilmentMode.DELIVERY ? 25.0 : 0.0;
      const totalGhs = produceSubtotal + transportCostEstimate;

      // 6. Determine starting lifecycle state via the state machine ruleset
      const targetStatus = resolveInitialStatus(farmer.orderMode);

      // 7. Commit order parameters inside the transaction boundary
      const orderData = txOrdersRepo.create({
        buyerId,
        farmerId: listing.farmerId,
        listingId: dto.listing_id,
        mode: dto.mode,
        quantityKg: requestedQty,
        pricePerKgGhs: pricePerKg,
        produceSubtotalGhs: produceSubtotal,
        packagingTypeId: dto.packaging_type_id || null,
        transportCostEstimateGhs: transportCostEstimate,
        totalGhs,
        deliveryAddress: dto.delivery_address || null,
        deliveryLocation: dto.delivery_location
          ? {
              type: "Point",
              coordinates: [
                dto.delivery_location.lng,
                dto.delivery_location.lat,
              ],
            }
          : null,
        status: targetStatus,
      });

      const order = await txOrdersRepo.save(orderData);

      // 8. Atomically reduce available stock quantity from the catalog listing
      listing.committedKg = Number(listing.committedKg || 0) + requestedQty;
      await txListingsRepo.save(listing);

      // 9. Automated Transport Trigger Condition
      if (
        order.status === OrderStatus.CONFIRMED &&
        order.mode === FulfilmentMode.DELIVERY
      ) {
        // Enforce location guards before dispatching to PostGIS parameters
        if (!dto.delivery_location || !farmer.location) {
          throw new BadRequestException(
            "Spatial coordinates for both pickup (farmer) and dropoff (buyer) are mandatory for auto-confirmed delivery orders.",
            ErrorCode.BAD_REQUEST,
          );
        }

        // Automatically dispatch the transport job to the market pool
        await this.transportService.requestHauling({
          order_id: order.id,
          pickup_location: {
            latitude: farmer.location.coordinates[1], // Extracting Lat from GeoJSON point [lng, lat]
            longitude: farmer.location.coordinates[0], // Extracting Lng from GeoJSON point [lng, lat]
          },
          dropoff_location: {
            latitude: dto.delivery_location.lat,
            longitude: dto.delivery_location.lng,
          },
          packaging_type_name: dto.packaging_type_name || "Standard Sacks",
          special_handling: dto.special_handling,
        });
      }

      return order;
    });
  }

  /**
   * Finalizes an order (Turns a temporary hold into a permanent hard inventory deduction)
   */
  async confirmOrder(userId: string, orderId: string): Promise<OrderEntity> {
    const order = await this.getValidatedOrder(orderId, userId, "farmer");
    assertValidTransition(order.status, OrderStatus.CONFIRMED);

    await this.ordersRepo.updateStatus(orderId, OrderStatus.CONFIRMED);

    // Hard Deduction: Shift inventory permanently out of both the catalog pool and the committed block
    const listing = await this.listingsRepo.findById(order.listingId);
    if (listing) {
      const orderQty = Number(order.quantityKg);
      const newTotalQuantity = Math.max(
        0,
        Number(listing.quantityKg) - orderQty,
      );
      const newCommittedQuantity = Math.max(
        0,
        Number(listing.committedKg || 0) - orderQty,
      );

      await this.listingsRepo.updateInventoryPools(
        listing.id,
        newTotalQuantity,
        newCommittedQuantity,
      );
    }

    return (await this.ordersRepo.findById(orderId))!;
  }

  /**
   * Advance order status to packed and branch out following delivery vs pickup workflows
   */
  async packOrder(userId: string, orderId: string): Promise<OrderEntity> {
    const order = await this.getValidatedOrder(orderId, userId, "farmer");

    const nextStatus = resolvePackedNextStatus(order.mode);
    assertValidTransition(order.status, nextStatus);

    await this.ordersRepo.updateStatus(orderId, nextStatus);
    return (await this.ordersRepo.findById(orderId))!;
  }

  /**
   * Enforces negotiation counter-offers
   */
  async negotiateOrder(
    userId: string,
    orderId: string,
    dto: NegotiateOrderDto,
  ): Promise<OrderEntity> {
    const order = await this.getValidatedOrder(orderId, userId, "either");
    assertValidTransition(order.status, OrderStatus.NEGOTIATING);

    const counterPrice = dto.counter_price_per_kg_ghs;
    const produceSubtotal = Number(order.quantityKg) * counterPrice;
    const totalGhs = produceSubtotal + Number(order.transportCostEstimateGhs);

    await this.ordersRepo.updateStatus(orderId, OrderStatus.NEGOTIATING, {
      negotiatedPricePerKgGhs: counterPrice,
      produceSubtotalGhs: produceSubtotal,
      totalGhs,
    });

    return (await this.ordersRepo.findById(orderId))!;
  }

  /**
   * Order cancellations (Returns allocated stock back to listing pool)
   */
  async cancelOrder(
    userId: string,
    orderId: string,
    dto: CancelOrderDto,
  ): Promise<OrderEntity> {
    const order = await this.getValidatedOrder(orderId, userId, "either");

    // Determine if we are canceling a pending hold or a post-confirmation active contract
    const wasConfirmed =
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PENDING_AGENT_CONFIRMATION &&
      order.status !== OrderStatus.PENDING_SMS_CONFIRMATION;
    assertValidTransition(order.status, OrderStatus.CANCELLED);

    await this.ordersRepo.updateStatus(orderId, OrderStatus.CANCELLED, {
      cancelledBy: userId,
      cancellationReason: dto.cancellation_reason,
    });

    // Restore stock inventory back to the seller's active listing
    const listing = await this.listingsRepo.findById(order.listingId);
    if (listing) {
      const orderQty = Number(order.quantityKg);
      if (wasConfirmed) {
        // If it was already confirmed, the hard deduction already happened. Return it back to public stock.
        await this.listingsRepo.updateQuantity(
          listing.id,
          Number(listing.quantityKg) + orderQty,
        );
      } else {
        // If it was still pending, it was only occupying the soft-hold pool. Release the committed slot.
        const newCommittedQuantity = Math.max(
          0,
          Number(listing.committedKg || 0) - orderQty,
        );
        await this.listingsRepo.updateCommittedQuantity(
          listing.id,
          newCommittedQuantity,
        );
      }
    }

    return (await this.ordersRepo.findById(orderId))!;
  }

  /**
   * Helper guard to fetch orders and confirm contextual ownership roles
   */
  private async getValidatedOrder(
    orderId: string,
    userId: string,
    requiredRole: "buyer" | "farmer" | "either",
  ): Promise<OrderEntity> {
    const order = await this.ordersRepo.findById(orderId);
    if (!order) {
      throw new NotFoundException(
        "Order instance not found",
        ErrorCode.ORDER_NOT_FOUND,
      );
    }

    const isBuyer = order.buyerId === userId;
    const isFarmer = order.farmerId === userId;

    if (requiredRole === "buyer" && !isBuyer)
      throw new ForbiddenException("Access denied", ErrorCode.ORDER_FORBIDDEN);
    if (requiredRole === "farmer" && !isFarmer)
      throw new ForbiddenException("Access denied", ErrorCode.ORDER_FORBIDDEN);
    if (requiredRole === "either" && !isBuyer && !isFarmer) {
      throw new ForbiddenException("Access denied", ErrorCode.ORDER_FORBIDDEN);
    }

    return order;
  }

  /**
   * Farmer or Authorized Agent explicitly declines a pending order contract
   */
  async declineOrder(
    userId: string,
    orderId: string,
    dto: DeclineOrderDto,
  ): Promise<OrderEntity> {
    const order = await this.getValidatedOrder(orderId, userId, "farmer");

    // Decline behaves like a cancellation from a state perspective, but uses a targeted reason column
    assertValidTransition(order.status, OrderStatus.CANCELLED);

    await this.ordersRepo.updateStatus(orderId, OrderStatus.CANCELLED, {
      cancelledBy: userId,
      cancellationReason: `DECLINED: ${dto.decline_reason}`,
    });

    // Instantly free up the soft-held allocated stock back to the active catalog pool
    const listing = await this.listingsRepo.findById(order.listingId);
    if (listing) {
      const newCommittedQuantity = Math.max(
        0,
        Number(listing.committedKg || 0) - Number(order.quantityKg),
      );
      await this.listingsRepo.updateCommittedQuantity(
        listing.id,
        newCommittedQuantity,
      );
    }

    return (await this.ordersRepo.findById(orderId))!;
  }
  /**
   * Fetches a paginated set of orders targeting a specific side of the marketplace
   */
  async getOrdersByRole(
    userId: string,
    role: string,
    page: number,
    limit: number,
  ): Promise<{ orders: OrderEntity[]; total: number }> {
    const offset = (page - 1) * limit;
    return this.ordersRepo.findAndCountByRole(userId, role, limit, offset);
  }

  /**
   * Secure view assertion logic to allow only contract parties visibility access
   */
  async getOrderDetailsForParty(
    orderId: string,
    userId: string,
  ): Promise<OrderEntity> {
    // Reuses your existing private roles guard logic from earlier
    return this.getValidatedOrder(orderId, userId, "either");
  }

  /**
   * Parses text commands (e.g., "YES 42" or "NO 42") sent from simple feature phones
   */
  async processInboundSmsCommand(
    senderMobile: string,
    messageBody: string,
  ): Promise<void> {
    // 1. Clean mobile formatting to locate the farmer record context
    const user = await this.usersRepo.findByMobile(senderMobile);
    if (!user) {
      throw new NotFoundException(
        "No user profile matches incoming mobile signature",
        ErrorCode.ORDER_FORBIDDEN,
      );
    }

    // 2. Tokenize string structure: e.g. ["YES", "42"] or ["NO", "42"]
    const parts = messageBody.split(/\s+/);
    const command = parts[0]?.toUpperCase();
    const orderShortId = parts[1]; // Or parse relational incremental code metrics

    if (!command || !orderShortId) {
      throw new BadRequestException(
        "Unrecognized inbound message format command tokens",
        ErrorCode.INBOUND_SMS_UNKNOWN_COMMAND,
      );
    }

    // 3. Locate the targeted pending order tied directly to this farmer
    // (Assuming findByShortIdAndFarmer filters strictly by farmerId and a short visible tracker sequence or order ID)
    const order = await this.ordersRepo.findByShortIdAndFarmer(
      orderShortId,
      user.id,
    );
    if (!order) {
      throw new NotFoundException(
        `Pending order with identifier "${orderShortId}" not found for this account`,
        ErrorCode.ORDER_NOT_FOUND,
      );
    }

    // 4. State Machine Execution based on token value
    if (command === "YES") {
      assertValidTransition(order.status, OrderStatus.CONFIRMED);
      await this.ordersRepo.updateStatus(order.id, OrderStatus.CONFIRMED);

      // Convert the soft-hold into a permanent inventory pool deduction
      const listing = await this.listingsRepo.findById(order.listingId);
      if (listing) {
        const orderQty = Number(order.quantityKg);
        const newTotalQuantity = Math.max(
          0,
          Number(listing.quantityKg) - orderQty,
        );
        const newCommittedQuantity = Math.max(
          0,
          Number(listing.committedKg || 0) - orderQty,
        );

        await this.listingsRepo.updateInventoryPools(
          listing.id,
          newTotalQuantity,
          newCommittedQuantity,
        );
      }
    } else if (command === "NO") {
      assertValidTransition(order.status, OrderStatus.CANCELLED);
      await this.ordersRepo.updateStatus(order.id, OrderStatus.CANCELLED, {
        cancelledBy: user.id,
        cancellationReason: "DECLINED_VIA_SMS_REPLY",
      });

      // Release the soft-held allocated slot back into public availability
      const listing = await this.listingsRepo.findById(order.listingId);
      if (listing) {
        const newCommittedQuantity = Math.max(
          0,
          Number(listing.committedKg || 0) - Number(order.quantityKg),
        );
        await this.listingsRepo.updateCommittedQuantity(
          listing.id,
          newCommittedQuantity,
        );
      }
    } else {
      throw new BadRequestException(
        `Invalid command verb "${command}". Text reply must begin explicitly with YES or NO followed by the order ID.`,
        ErrorCode.INBOUND_SMS_UNKNOWN_COMMAND,
      );
    }
  }

  /**
   * When the buyer physically arrives at the farm, the farmer inputs the code to release it.
   */
  async verifyBuyerPickup(
    orderId: string,
    farmerId: string,
    inputPin: string,
  ): Promise<OrderEntity> {
    return await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const userRepo = manager.getRepository(User);

      const order = await orderRepo.findOne({
        where: { id: orderId, farmerId },
        lock: { mode: "pessimistic_write" },
      });

      if (!order || order.status !== OrderStatus.PACKED) {
        throw new BadRequestException(
          "Order is not ready for pickup collection.",
          ErrorCode.BAD_REQUEST,
        );
      }

      const buyer = await userRepo.findOneBy({ id: order.buyerId });

      // Validate code directly via Arkesel
      try {
        // Evaluate verification code securely against Arkesel's session state
        await arkeselClient.verifyOtp(buyer!.phone, inputPin);
      } catch (otpError: any) {
        throw new BadRequestException(otpError.message, ErrorCode.BAD_REQUEST);
      }

      // Transition state: PACKED -> COLLECTED (Terminal state)
      // Transition state to terminal pickup status: PACKED -> COLLECTED
      const terminalStatus = OrderStatus.COLLECTED;
      assertValidTransition(order.status as OrderStatus, terminalStatus);

      order.status = terminalStatus;
      return await orderRepo.save(order);
    });
  }
  async markReadyForPickup(
    orderId: string,
    farmerId: string,
  ): Promise<OrderEntity> {
    return await this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(OrderEntity);
      const userRepo = manager.getRepository(User);

      const order = await orderRepo.findOne({
        where: { id: orderId, farmerId },
        lock: { mode: "pessimistic_write" },
      });

      if (!order) {
        throw new NotFoundException(
          "Active order context records not found.",
          ErrorCode.ORDER_NOT_FOUND,
        );
      }
      if (order.mode !== FulfilmentMode.PICKUP) {
        throw new BadRequestException(
          "This order is designated for delivery tracking pipelines.",
          ErrorCode.BAD_REQUEST,
        );
      }

      // Enforce state transition safety rule: CONFIRMED -> PACKED
      const targetStatus = OrderStatus.PACKED;
      assertValidTransition(order.status as OrderStatus, targetStatus);

      const buyer = await userRepo.findOneBy({ id: order.buyerId });
      if (!buyer || !buyer.phone) {
        throw new BadRequestException(
          "Buyer contact data is currently unavailable for OTP verification.",
          ErrorCode.BAD_REQUEST,
        );
      }

      // Update state locally
      order.status = targetStatus;
      const updatedOrder = await orderRepo.save(order);
      const fullname = `${buyer.firstName} ${buyer.middleName} ${buyer.lastName}`;
      // Dispatches the 6-minute Arkesel verification code to the buyer
      try {
        // Evaluate verification code securely against Arkesel's session state
        await arkeselClient.generateAndSendDoorstepOtp(buyer.phone, fullname);
      } catch (otpError: any) {
        throw new BadRequestException(otpError.message, ErrorCode.BAD_REQUEST);
      }

      return updatedOrder;
    });
  }
}

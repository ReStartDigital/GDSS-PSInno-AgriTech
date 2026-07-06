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

export class OrdersService {
  constructor(
    private ordersRepo: OrdersRepository,
    private listingsRepo: ListingsRepository,
    private usersRepo: UserRepository,
  ) {}

  /**
   * Places a new order and runs core pricing calculus
   */
  async createOrder(
    buyerId: string,
    dto: CreateOrderDto,
  ): Promise<OrderEntity> {
    // 1. Fetch the produce listing
    const listing = await this.listingsRepo.findById(dto.listing_id);
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

    if (requestedQty > listing.quantityKg) {
      throw new BadRequestException(
        `Requested quantity exceeds available stock (${availableStock}kg remaining)`,
        ErrorCode.QUANTITY_EXCEEDS_AVAILABLE,
      );
    }

    // 4. Resolve the farmer's order mode workflow strategy
    const farmer = await this.usersRepo.findById(listing.farmerId);
    if (!farmer) {
      throw new NotFoundException(
        "Farmer account record not found",
        ErrorCode.ORDER_FORBIDDEN,
      );
    }

    // 5. Billing Calculus: Produce subtotal + logistics (no extra arbitrary packaging upcharges)
    const pricePerKg = Number(listing.pricePerKgGhs);
    const produceSubtotal = requestedQty * pricePerKg;

    // In a future sprint, this will be calculated dynamically by your Transport/Logistics engine
    const transportCostEstimate =
      dto.mode === FulfilmentMode.DELIVERY ? 25.0 : 0.0;
    const totalGhs = produceSubtotal + transportCostEstimate;

    // 6. Determine starting lifecycle state via the state machine rule set
    const targetStatus = resolveInitialStatus(farmer.orderMode);

    // 7. Commit order parameters to the database
    const order = await this.ordersRepo.create({
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
            coordinates: [dto.delivery_location.lng, dto.delivery_location.lat],
          }
        : null,
      status: targetStatus,
    });

    // 8. Atomically reduce available stock quantity from the catalog listing
    await this.listingsRepo.updateCommittedQuantity(
      listing.id,
      Number(listing.committedKg || 0) + requestedQty,
    );

    return order;
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
}

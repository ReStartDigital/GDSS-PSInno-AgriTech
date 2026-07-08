import type { Request, Response, NextFunction } from "express";
import { OrdersService } from "./orders.service.js";
import {
  createOrderSchema,
  negotiateOrderSchema,
  cancelOrderSchema,
  declineOrderSchema,
} from "./orders.schemas.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import {
  BadRequestException,
  UnprocessableException,
} from "../../common/exceptions/index.js";
import { HttpStatusCode } from "axios";

export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  /**
   * POST /orders
   * Secure endpoint for a buyer to submit a checkout order payload
   */
  createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const buyerId = req.user!.sub; // Derived safely from your auth authentication middleware
      const validatedBody = createOrderSchema.parse(req.body);

      const order = await this.ordersService.createOrder(
        buyerId,
        validatedBody,
      );

      res.status(201).json({
        success: true,
        message: "Order placed successfully and stock allocation reserved.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /orders/:id/confirm
   * Farmer accepts the order contract (converts soft-hold to hard inventory deduction)
   */
  confirmOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const orderId = req.params.id as string;
      if (!orderId) {
        throw new UnprocessableException(
          "Listing ID is required",
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const order = await this.ordersService.confirmOrder(userId, orderId);

      res.status(200).json({
        success: true,
        message: "Order confirmed successfully. Inventory pools finalized.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /orders/:id/pack
   * Farmer marks the produce as boxed, crated, and ready for transit handover
   */
  packOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const orderId = req.params.id as string;
      if (!orderId) {
        throw new UnprocessableException(
          "Listing ID is required",
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const order = await this.ordersService.packOrder(userId, orderId);

      res.status(200).json({
        success: true,
        message:
          "Order status updated to packed. Route workflow branched successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /orders/:id/negotiate
   * Counter-offer pricing handshake submitted by a party
   */
  negotiateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const orderId = req.params.id as string;
      if (!orderId) {
        throw new UnprocessableException(
          "Listing ID is required",
          ErrorCode.VALIDATION_ERROR,
        );
      }
      const validatedBody = negotiateOrderSchema.parse(req.body);

      const order = await this.ordersService.negotiateOrder(
        userId,
        orderId,
        validatedBody,
      );

      res.status(200).json({
        success: true,
        message: "Counter-offer pricing recorded successfully.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /orders/:id/cancel
   * Terminates the order contract and cleanly handles stock rollbacks
   */
  cancelOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const orderId = req.params.id as string;
      if (!orderId) {
        throw new UnprocessableException(
          "Listing ID is required",
          ErrorCode.VALIDATION_ERROR,
        );
      }
      const validatedBody = cancelOrderSchema.parse(req.body);

      const order = await this.ordersService.cancelOrder(
        userId,
        orderId,
        validatedBody,
      );

      res.status(200).json({
        success: true,
        message: "Order cancelled successfully. Stock allocations adjusted.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /orders/:id/decline
   * Farmer or corporate agent rejects the contract and frees the inventory soft-hold
   */
  declineOrder = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const orderId = req.params.id as string;
      if (!orderId) {
        throw new UnprocessableException(
          "Listing ID is required",
          ErrorCode.VALIDATION_ERROR,
        );
      }

      // Enforces the schema we established earlier containing the minimum 4 character requirement
      const validatedBody = declineOrderSchema.parse(req.body);

      const order = await this.ordersService.declineOrder(
        userId,
        orderId,
        validatedBody,
      );

      res.status(200).json({
        success: true,
        message:
          "Order declined successfully. Stock allocations released back to public availability.",
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /orders
   * Retrieves paginated order history contextually filtered by the user's active structural role
   */
  getOrders = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const userRole = req.user!.role; // e.g., UserRole.BUYER or UserRole.FARMER

      // Parse pagination parameters with safe defaults
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.max(
        1,
        Math.min(100, parseInt(req.query.limit as string) || 20),
      );

      const { orders, total } = await this.ordersService.getOrdersByRole(
        userId,
        userRole,
        page,
        limit,
      );

      res.status(200).json({
        success: true,
        meta: {
          total_records: total,
          current_page: page,
          limit,
          total_pages: Math.ceil(total / limit),
        },
        data: orders,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * GET /orders/:id
   * Fetches full record parameters. Securely guarded to only allow involved parties.
   */
  getOrderById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const userId = req.user!.sub;
      const { id: orderId } = req.params;

      if (!orderId || typeof orderId !== "string") {
        throw new BadRequestException(
          "Invalid or missing order identifier",
          ErrorCode.BAD_REQUEST,
        );
      }

      // The service layer internally validates if the user is a buyer, farmer, or assigned transporter
      const order = await this.ordersService.getOrderDetailsForParty(
        orderId,
        userId,
      );

      res.status(200).json({
        success: true,
        data: order,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /orders/inbound-sms
   * Public webhook endpoint parsing Arkesel SMS gateway payload structures for USSD/SMS offline confirmation replies
   */
  handleInboundSms = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Arkesel usually pushes incoming text strings as 'from' (sender mobile number) and 'message' text body
      const { from, message } = req.body;

      if (!from || !message) {
        throw new BadRequestException(
          "Malformed webhook payload structural properties missing",
          ErrorCode.BAD_REQUEST,
        );
      }

      await this.ordersService.processInboundSmsCommand(
        from,
        String(message).trim(),
      );

      // Webhook responses should return clean standard acknowledgments to prevent the gateway provider from retrying
      res.status(200).json({
        success: true,
        message:
          "Webhook event processed and state machine adjustments completed.",
      });
    } catch (error) {
      next(error);
    }
  };
  /**
   * Step 1: Fire Outbound Pickup OTP Token
   */
  markReadyForPickup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const orderId = req.params.id as string;
      const farmerId = req.user?.sub as string;

      if (!orderId || !farmerId) {
        throw new UnprocessableException(
          "Order ID and farmer authentication context are required.",
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const updatedOrder = await this.ordersService.markReadyForPickup(
        orderId,
        farmerId,
      );

      res.status(HttpStatusCode.Ok).json({
        success: true,
        message:
          "Order items compiled. A 6-minute warehouse collection PIN has been sent to the buyer.",
        data: updatedOrder,
      });
    } catch (error) {
      next(error); // Safe transactional rollbacks on network fail
    }
  };

  /**
   * Step 2: Validate Handoff PIN and Clear Escrow
   */
  verifyBuyerPickup = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const orderId = req.params.id as string;
      const farmerId = req.user?.sub as string;
      const { verification_pin } = req.body;

      if (!orderId || !verification_pin) {
        throw new UnprocessableException(
          "Order ID and verification_pin are required properties.",
          ErrorCode.VALIDATION_ERROR,
        );
      }

      const completedOrder = await this.ordersService.verifyBuyerPickup(
        orderId,
        farmerId,
        verification_pin,
      );

      res.status(HttpStatusCode.Ok).json({
        success: true,
        message:
          "Handoff verified successfully via Arkesel. Order state moved to terminal COLLECTED status.",
        data: completedOrder,
      });
    } catch (error) {
      next(error);
    }
  };
}

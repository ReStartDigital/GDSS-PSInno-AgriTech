import type { Request, Response, NextFunction } from "express";
import { OrdersService } from "./orders.service.js";
import {
  createOrderSchema,
  negotiateOrderSchema,
  cancelOrderSchema,
  declineOrderSchema,
} from "./orders.schemas.js";

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
      const { id: orderId } = req.params;

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
      const { id: orderId } = req.params;

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
      const { id: orderId } = req.params;
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
      const { id: orderId } = req.params;
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
      const { id: orderId } = req.params;

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
}

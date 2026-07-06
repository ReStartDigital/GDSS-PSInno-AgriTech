import { Router } from "express";
import { OrdersController } from "./orders.controller.js";
import { OrdersService } from "./orders.service.js";
import { OrdersRepository } from "./orders.repository.js";
import { ListingsRepository } from "../listings/listings.repository.js";
import { UserRepository } from "../user/user.repository.js";
import { authenticate } from "../../common/middleware/authenticate.middleware.js";
import { authorize } from "../../common/middleware/authorization.middleware.js";
import { AppDataSource } from "../../config/database.config.js";
import { UserRole } from "../../common/constants/roles.enums.js";

const router = Router();

// 1. Dependency Injection Setup
const ordersRepo = new OrdersRepository(AppDataSource);
const listingsRepo = new ListingsRepository();
const usersRepo = new UserRepository();

const ordersService = new OrdersService(ordersRepo, listingsRepo, usersRepo);
const ordersController = new OrdersController(ordersService);

// 2. Route Declarations (All protected via authentication)
router.use(authenticate);

/**
 * @openapi
 * /orders:
 *   post:
 *     summary: Place a new order
 *     description: Initiates a purchase checkout against a crop listing, immediately establishing a stock reservation (soft-hold).
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrderBody'
 *     responses:
 *       201:
 *         description: Order placed successfully and stock allocation reserved.
 *       400:
 *         description: Bad Request (e.g., requested quantity exceeds stock availability).
 *       401:
 *         description: Unauthorized. Invalid or missing token.
 *       403:
 *         description: Forbidden. User lacks the BUYER role.
 *       404:
 *         description: Target listing or producer account not found.
 */
router.post("/", authorize(UserRole.BUYER), ordersController.createOrder);

/**
 * @openapi
 * /orders/{id}/confirm:
 *   patch:
 *     summary: Confirm a pending order
 *     description: Executed by a producer or administrative agent to accept a contract, converting the temporary stock hold into a permanent deduction.
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the order.
 *     responses:
 *       200:
 *         description: Order confirmed successfully. Inventory pools finalized.
 *       400:
 *         description: Invalid state transition constraint violation.
 *       401:
 *         description: Unauthorized. Invalid or missing token.
 *       403:
 *         description: Forbidden. User lacks the FARMER or AGENT role.
 *       404:
 *         description: Order record not found.
 */
router.patch(
  "/:id/confirm",
  authorize(UserRole.FARMER, UserRole.AGENT),
  ordersController.confirmOrder,
);

/**
 * @openapi
 * /orders/{id}/decline:
 *   patch:
 *     summary: Decline a pending order
 *     description: Rejects an incoming order request and immediately releases any soft-held crop volume back into public catalog availability.
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the order.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - decline_reason
 *             properties:
 *               decline_reason:
 *                 type: string
 *                 minLength: 4
 *                 example: "Produce already committed to a local wholesale market batch."
 *     responses:
 *       200:
 *         description: Order declined successfully. Stock allocations released.
 *       401:
 *         description: Unauthorized. Invalid or missing token.
 *       403:
 *         description: Forbidden. User lacks the FARMER or AGENT role.
 *       404:
 *         description: Order instance not found.
 */
router.patch(
  "/:id/decline",
  authorize(UserRole.FARMER, UserRole.AGENT),
  ordersController.declineOrder,
);

/**
 * @openapi
 * /orders/{id}/negotiate:
 *   patch:
 *     summary: Submit a pricing counter-offer
 *     description: Registers an updated unit rate recommendation per kilogram, altering the pending billing totals before contract finalization.
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the order.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - counter_price_per_kg_ghs
 *             properties:
 *               counter_price_per_kg_ghs:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 5.50
 *     responses:
 *       200:
 *         description: Counter-offer pricing recorded successfully.
 *       400:
 *         description: Invalid state transition context.
 *       401:
 *         description: Unauthorized. Invalid or missing token.
 *       403:
 *         description: Forbidden. User lacks the FARMER or BUYER role.
 */
router.patch(
  "/:id/negotiate",
  authorize(UserRole.FARMER, UserRole.BUYER),
  ordersController.negotiateOrder,
);

/**
 * @openapi
 * /orders/{id}/pack:
 *   patch:
 *     summary: Mark produce as packed
 *     description: Shifts the status to packed and dynamically routes the order forward based on whether it is a delivery or a customer warehouse pickup.
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the order.
 *     responses:
 *       200:
 *         description: Order status updated to packed. Route workflow branched successfully.
 *       401:
 *         description: Unauthorized. Invalid or missing token.
 *       403:
 *         description: Forbidden. User lacks the FARMER or AGENT role.
 */
router.patch(
  "/:id/pack",
  authorize(UserRole.FARMER, UserRole.AGENT),
  ordersController.packOrder,
);

/**
 * @openapi
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel an active order contract
 *     description: Terminates the transaction contract and runs automatic stock rollback calculations depending on the active lifecycle stage.
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique identifier of the order.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cancellation_reason
 *             properties:
 *               cancellation_reason:
 *                 type: string
 *                 minLength: 4
 *                 example: "Alternative logistical transport arrangements fell through."
 *     responses:
 *       200:
 *         description: Order cancelled successfully. Stock allocations adjusted.
 *       401:
 *         description: Unauthorized. Invalid or missing token.
 *       403:
 *         description: Forbidden. User lacks an authorized role.
 */
router.patch(
  "/:id/cancel",
  authorize(UserRole.FARMER, UserRole.AGENT, UserRole.BUYER),
  ordersController.cancelOrder,
);

export { router as ordersRouter };

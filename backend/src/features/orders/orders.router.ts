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

const ordersService = new OrdersService(
  ordersRepo,
  listingsRepo,
  usersRepo,
  AppDataSource,
);
const ordersController = new OrdersController(ordersService);

// 2. Route Declarations (All protected via authentication)
router.use(authenticate);

/**
 * @openapi
 * /api/v1/orders:
 *   get:
 *     summary: Retrieve contextual orders
 *     description: Fetches a paginated history of orders relative to the authenticated user's active context (Buyer vs. Farmer).
 *     tags:
 *       - Orders
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Array of localized orders retrieved successfully.
 *       401:
 *         description: Unauthorized.
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
 *         description: Bad Request.
 *       403:
 *         description: Forbidden. User lacks the BUYER role.
 */
router
  .route("/")
  .get(ordersController.getOrders)
  .post(authorize(UserRole.BUYER), ordersController.createOrder);

/**
 * @openapi
 * /api/v1/orders/{id}:
 *   get:
 *     summary: Get order details
 *     description: Fetches full relational details for an order. Restricted strictly to involved stakeholders (Buyer, Farmer, or assigned Transporter).
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
 *     responses:
 *       200:
 *         description: Order detailed profile data returned.
 *       403:
 *         description: Forbidden. User is not a structural party to this order transaction.
 *       404:
 *         description: Order not found.
 */
router.get(
  "/:id",
  authorize(UserRole.BUYER, UserRole.FARMER, UserRole.AGENT), // Extend role inclusion contextually
  ordersController.getOrderById,
);

// NOTE: POST /orders is already defined via the .route("/") chain above (line 77-80).
// A duplicate was removed here to prevent double-registration.

/**
 * @openapi
 * /api/v1/orders/{id}/confirm:
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
 * /api/v1/orders/{id}/decline:
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
 * /api/v1/orders/{id}/negotiate:
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
 * /api/v1/orders/{id}/pack:
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
 * /api/v1/orders/{id}/cancel:
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

/**
 * @openapi
 * /api/v1/orders/{id}/ready-pickup:
 *   patch:
 *     summary: Pickup Step 1 - Mark order cargo as packed and dispatch Arkesel OTP
 *     description: Farmers call this endpoint when produce is fully prepared at the warehouse. Flips the order status to `PACKED` and initializes a strict 6-minute server-side Arkesel OTP sent directly to the buyer's phone.
 *     tags:
 *       - Order Fulfillment
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique UUID v4 identifier of the target order record.
 *     responses:
 *       200:
 *         description: Order state changed to PACKED. 6-minute handoff PIN dispatched.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Order items compiled. A 6-minute warehouse collection PIN has been sent to the buyer."
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid order context or state transition violation.
 *       401:
 *         description: Unauthorized access token.
 *       422:
 *         description: Missing parameter or validation error.
 */
router.patch(
  "/:id/ready-pickup",
  authorize(UserRole.FARMER, UserRole.AGENT),
  ordersController.markReadyForPickup,
);

/**
 * @openapi
 * /api/v1/orders/{id}/verify-pickup:
 *   post:
 *     summary: Pickup Step 2 - Validate buyer handoff PIN and finalize order lifecycle
 *     description: Farmers call this endpoint in-person when the buyer arrives at the farm. Verifies the input code against Arkesel's session state. On success, moves the order status to terminal `COLLECTED` and releases funds from escrow.
 *     tags:
 *       - Order Fulfillment
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique UUID v4 identifier of the active order.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - verification_pin
 *             properties:
 *               verification_pin:
 *                 type: string
 *                 minLength: 4
 *                 maxLength: 8
 *                 example: "482915"
 *                 description: The numeric 6-digit Arkesel SMS code presented by the buyer.
 *     responses:
 *       200:
 *         description: Handoff verified. Order status updated to COLLECTED.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Handoff verified successfully via Arkesel. Order state moved to terminal COLLECTED status."
 *                 data:
 *                   $ref: '#/components/schemas/Order'
 *       400:
 *         description: Invalid/expired handshake PIN or invalid order state.
 *       422:
 *         description: Validation error or unprocessable payload.
 */
router.post(
  "/:id/verify-pickup",
  authorize(UserRole.FARMER, UserRole.AGENT),
  ordersController.verifyBuyerPickup,
);

export { router as ordersRouter };

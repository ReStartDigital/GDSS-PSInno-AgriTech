import { Router } from "express";
import { TransportController } from "./transport.controller.js";
import { TransportRepository } from "./transport.repository.js";
import { TransportService } from "./transport.service.js";
import { AppDataSource } from "../../config/database.config.js";
import { authenticate } from "../../common/middleware/authenticate.middleware.js";
import { UserRole } from "../../common/constants/roles.enums.js";
import { authorize } from "../../common/middleware/authorization.middleware.js";

const transportRouter = Router();

// Initialize clean data-layer dependency tree injections
const transportRepo = new TransportRepository(AppDataSource);
const transportService = new TransportService(transportRepo, AppDataSource);
const controller = new TransportController(transportService);

transportRouter.use(authenticate);
/**
 * @openapi
 * /api/v1/transport/request:
 *   post:
 *     summary: Manually initialize transport routing for an unconfirmed order
 *     description: Creates an open logistics routing entry with spatial route matrices calculating linear distances via PostGIS. Used primarily when an order is not automatically confirmed.
 *     tags:
 *       - Transport Logistics
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - pickup_location
 *               - dropoff_location
 *               - packaging_type_name
 *             properties:
 *               order_id:
 *                 type: string
 *                 format: uuid
 *                 example: "437b01d3-6e3a-4b95-a226-9d32dc86fc12"
 *               pickup_location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: 5.6037
 *                   longitude:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: -0.1870
 *               dropoff_location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     example: 6.6666
 *                   longitude:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     example: -1.6163
 *               packaging_type_name:
 *                 type: string
 *                 maxLength: 255
 *                 example: "Standard Sacks"
 *               special_handling:
 *                 type: string
 *                 maxLength: 1000
 *                 example: "Fragile produce, keep away from direct sunlight."
 *     responses:
 *       201:
 *         description: Transport routing entry initialized successfully.
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
 *                   example: "Transport dispatch routing initialized successfully."
 *                 data:
 *                   $ref: '#/components/schemas/TransportRequest'
 *       400:
 *         description: Invalid coordinates, bad formatting, or unverified order payment state.
 *       401:
 *         description: Unauthorized. Missing or invalid Bearer JWT token.
 *       409:
 *         description: Conflict. A shipping route profile already exists for this order.
 */
transportRouter.post(
  "/request",
  authorize(UserRole.FARMER),
  controller.createRequest,
);

/**
 * @openapi
 * /api/v1/transport/available:
 *   get:
 *     summary: Browse unclaimed delivery shipping contracts
 *     description: Returns a paginated feed of logistics contracts awaiting assignment. If optional coordinates are supplied, results are geofenced and sorted by closest proximity using PostGIS geography structures.
 *     tags:
 *       - Transport Logistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page offset index.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of records returned per page.
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *           minimum: -90
 *           maximum: 90
 *         description: Transporter's current latitude coordinate. Required if radius searching.
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *           minimum: -180
 *           maximum: 180
 *         description: Transporter's current longitude coordinate. Required if radius searching.
 *       - in: query
 *         name: radius_km
 *         schema:
 *           type: number
 *           default: 50
 *         description: Bounding search radius threshold in kilometers.
 *     responses:
 *       200:
 *         description: A paginated list of open transport requests.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 meta:
 *                   type: object
 *                   properties:
 *                     total_records:
 *                       type: integer
 *                       example: 42
 *                     current_page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TransportRequest'
 *       400:
 *         description: Invalid query parameters or mismatched geolocation arguments.
 *       401:
 *         description: Unauthorized.
 */
transportRouter.get(
  "/available",
  authorize(UserRole.TRANSPORTER),
  controller.getAvailableJobs,
);

/**
 * @openapi
 * /api/v1/transport/my-jobs:
 *   get:
 *     summary: Retrieve claimed logistics contracts
 *     description: Returns a paginated list of transport requests assigned to the authenticated transporter.
 *     tags:
 *       - Transport Logistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page offset index.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of records returned per page.
 *     responses:
 *       200:
 *         description: A paginated list of transporter's jobs.
 *       401:
 *         description: Unauthorized.
 */
transportRouter.get(
  "/my-jobs",
  authorize(UserRole.TRANSPORTER),
  controller.getMyJobs,
);

/**
 * @openapi
 * /api/v1/transport/{id}/accept:
 *   patch:
 *     summary: Accept and claim a freight hauling job request
 *     description: Enforces an exclusive pessimistic write-lock context over the job entry to eliminate concurrency race-conditions. Atomically links the driver and transitions the core order state machinery to `PACKED`.
 *     tags:
 *       - Transport Logistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique UUID v4 identifier of the target transport request row.
 *     responses:
 *       200:
 *         description: Job claimed successfully.
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
 *                   example: "Job contract claimed and assigned to your logistics profile. Order set to PACKED."
 *                 data:
 *                   $ref: '#/components/schemas/TransportRequest'
 *       404:
 *         description: Transport request or referenced order could not be located.
 *       409:
 *         description: Conflict. The job has already been claimed by another carrier or the order transition state is invalid.
 */
transportRouter.patch(
  "/:id/accept",
  authorize(UserRole.TRANSPORTER),
  controller.acceptAssignment,
);

/**
 * @openapi
 * /api/v1/transport/{id}/delivered:
 *   post:
 *     summary: Verify delivery and finalize order lifecycle via Arkesel OTP
 *     description: Validates the buyer's 4-to-8 character handoff verification token against the external Arkesel OTP infrastructure sessions. On successful verification, the shipping row turns `DELIVERED`, and the order drops into terminal `DELIVERED` status.
 *     tags:
 *       - Transport Logistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique UUID v4 identifier of the active transport request.
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
 *                 example: "598124"
 *                 description: The Arkesel SMS OTP token collected in-person from the buyer at the drop-off site.
 *     responses:
 *       200:
 *         description: Delivery verified and shipment lifecycle concluded.
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
 *                   example: "Delivery verified successfully via Arkesel handshake. Financial escrow metrics finalized."
 *                 data:
 *                   $ref: '#/components/schemas/TransportRequest'
 *       400:
 *         description: Invalid or expired Arkesel OTP token, or invalid route status state.
 *       404:
 *         description: Transport asset profile not found or unassociated to active runner.
 */
transportRouter.post(
  "/:id/delivered",
  authenticate,
  controller.confirmDelivery,
);

/**
 * @openapi
 * /transport/{id}/arrive:
 *   patch:
 *     summary: Step 1 - Trigger doorstep arrival and send a 6-minute OTP
 *     description: Driver checks in at the buyer's doorstep. This triggers a real-time Arkesel SMS OTP with a strict 6-minute expiration limit sent to the buyer.
 *     tags:
 *       - Transport Logistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: The unique transport request identifier.
 *     responses:
 *       200:
 *         description: Doorstep check-in logged. Arkesel OTP dispatched to buyer.
 *       400:
 *         description: Route contract is not in a valid state to log arrival.
 */
transportRouter.patch(
  "/:id/arrive",
  authorize(UserRole.TRANSPORTER),
  controller.triggerDoorstepArrival,
);

export { transportRouter };

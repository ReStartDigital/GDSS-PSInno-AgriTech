import { Router } from "express";
import { usersController } from "./users.controller.js";
import {
  validate
} from "../../common/middleware/validate.middleware.js";
import { authenticate as authenticateJwt } from "../../common/middleware/authenticate.middleware.js";
import { authorize as authorizeRoles } from "../../common/middleware/authorization.middleware.js"; // Standard RBAC checker middleware
import { uploadSingleImage as upload } from "../../common/middleware/upload.middleware.js";
import { UserRole } from "../../common/constants/roles.enums.js";
import {
  updateProfileSchema,
  changePinSchema,
  paymentDetailsSchema,
  paginationSchema,
  registerClientSchema,
} from "./users.schemas.js";

const router = Router();

// All user management routes require a valid JWT Access Token
router.use(authenticateJwt);

// ── OWN PROFILE ROUTING ──────────────────────────────────────────────────────

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Retrieve own profile details
 *     description: Returns the full authentic identity vector for the authenticated caller.
 *     tags: [Users Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully.
 *       401:
 *         description: Unauthorized - Invalid or expired access token.
 */
router.get("/me", usersController.getMyProfile);

/**
 * @openapi
 * /users/me:
 *   patch:
 *     summary: Update profile details
 *     description: Modifies mutable user attributes (Names, Geo-spatial Points) with runtime body checks.
 *     tags: [Users Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileDto'
 *     responses:
 *       200:
 *         description: Profile mutated successfully.
 *       422:
 *         description: Validation failure or empty patch body.
 */
router.patch(
  "/me",
  validate(updateProfileSchema),
  usersController.updateMyProfile,
);

/**
 * @openapi
 * /users/me/photo:
 *   post:
 *     summary: Upload profile photo
 *     description: Ingests an in-memory image stream buffer and uploads it directly to Cloudinary.
 *     tags: [Users Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar image uploaded and bound successfully.
 *       422:
 *         description: Multipart stream missing or malformed.
 */
router.post("/me/photo", upload("avatar"), usersController.uploadAvatar);

/**
 * @openapi
 * /users/me/pin:
 *   patch:
 *     summary: Change profile access PIN
 *     description: Rotates application security PIN strings after securely verifying the current PIN.
 *     tags: [Users Profile]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePinDto'
 *     responses:
 *       200:
 *         description: PIN rotated successfully.
 *       401:
 *         description: Verification failure - Old PIN mismatch.
 */
router.patch(
  "/me/pin",
  validate(changePinSchema),
  usersController.changeMyPin,
);

// ── FINANCIAL / MERCHANT CONFIGURATION ROUTING (RBAC: Farmer, Transporter) ───

/**
 * @openapi
 * /users/me/payment-details:
 *   post:
 *     summary: Setup distribution channel details
 *     description: Provisions a split financial settlement subaccount with the Paystack Infrastructure network.
 *     x-rbac-roles: [farmer, transporter]
 *     tags: [Merchant Ledger]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentDetailsDto'
 *     responses:
 *       200:
 *         description: Merchant split ledger provisioned smoothly.
 *       403:
 *         description: Forbidden - Insufficient role clearance.
 *       409:
 *         description: Conflict - Payment parameters are already set.
 */
router.post(
  "/me/payment-details",
  authorizeRoles(UserRole.FARMER, UserRole.TRANSPORTER),
  validate(paymentDetailsSchema),
  usersController.configurePaymentDetails,
);

/**
 * @openapi
 * /users/me/earnings:
 *   get:
 *     summary: Get operator performance and earnings metrics
 *     description: Pulls aggregated transaction totals and payouts for the active operator.
 *     x-rbac-roles: [farmer, transporter]
 *     tags: [Merchant Ledger]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Metrics generated successfully.
 *       403:
 *         description: Forbidden - Insufficient role clearance.
 */
router.get(
  "/me/earnings",
  authorizeRoles(UserRole.FARMER, UserRole.TRANSPORTER),
  usersController.getMyEarnings,
);

// ── PUBLIC RESOURCE ROUTING ──────────────────────────────────────────────────

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     summary: Fetch public user profile
 *     description: Exposes an open user profile card stripped of critical PII or secret financial elements.
 *     tags: [Users Profile]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identity footprint key.
 *     responses:
 *       200:
 *         description: Public card array retrieved successfully.
 *       404:
 *         description: Active target profile not found.
 */
router.get("/:id", usersController.getPublicProfile);

// ── PROXY AGENT MANAGEMENT ACTIONS (RBAC: Agent) ─────────────────────────────

/**
 * @openapi
 * /agent/clients:
 *   post:
 *     summary: Register an offline client entity
 *     description: Provisions an unverified offline-first proxy client mapped underneath the active agent.
 *     x-rbac-roles: [agent]
 *     tags: [Agent Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterClientDto'
 *     responses:
 *       201:
 *         description: Client profile generated and bound cleanly.
 *       403:
 *         description: Forbidden - Only agents can register clients.
 *       409:
 *         description: Conflict - Number footprint already exists or loop assignment error.
 */
router.post(
  "/agent/clients",
  authorizeRoles(UserRole.AGENT),
  validate(registerClientSchema),
  usersController.registerManagedClient,
);

/**
 * @openapi
 * /agent/clients:
 *   get:
 *     summary: List assigned managed clients
 *     description: Returns a paginated window of all offline clients assigned to this agent's dashboard.
 *     x-rbac-roles: [agent]
 *     tags: [Agent Management]
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
 *         description: Paginated collection returned successfully.
 */
router.get(
  "/agent/clients",
  authorizeRoles(UserRole.AGENT),
  validate(paginationSchema, "query"),
  usersController.getMyManagedClients,
);

/**
 * @openapi
 * /agent/clients/{id}/unassign:
 *   patch:
 *     summary: Unassign a tracked client
 *     description: Breaks the active management tracking bridge map link between the agent and client.
 *     x-rbac-roles: [agent]
 *     tags: [Agent Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tracking linkage deactivated cleanly.
 *       404:
 *         description: No matching active assignment relationship found.
 */
router.patch(
  "/agent/clients/:id/unassign",
  authorizeRoles(UserRole.AGENT),
  usersController.unassignManagedClient,
);

export { router as usersRouter };

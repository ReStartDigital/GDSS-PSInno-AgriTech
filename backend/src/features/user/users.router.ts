import { Router } from "express";
import { usersController } from "./users.controller.js";

import { validate } from "../../common/middleware/validate.middleware.js";
import { authenticate as authenticateJwt } from "../../common/middleware/authenticate.middleware.js";
import { authorize as authorizeRoles } from "../../common/middleware/authorization.middleware.js";
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

/** ========================
 *  GLOBAL MIDDLEWARE
 *  ======================== */
router.use(authenticateJwt); // All routes require valid JWT

// ── OWN PROFILE ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Get current user profile
 *     description: Returns the full profile of the authenticated user.
 *     tags: [Users Profile]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200: { description: Profile retrieved successfully. }
 *       401: { description: Unauthorized - Invalid or expired token. }
 */
router.get("/me", usersController.getMyProfile);

/**
 * @swagger
 * /api/v1/users/me:
 *   patch:
 *     summary: Update current user profile
 *     description: Update mutable fields (name, location, etc.).
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
 *       200: { description: Profile updated successfully. }
 *       422: { description: Validation error. }
 */
router.patch(
  "/me",
  validate(updateProfileSchema),
  usersController.updateMyProfile,
);

/**
 * @swagger
 * /api/v1/users/me/photo:
 *   post:
 *     summary: Upload profile photo
 *     description: Uploads and processes a new avatar image via Cloudinary.
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
 *       200: { description: Avatar uploaded successfully. }
 *       422: { description: Invalid or missing image file. }
 */
router.post("/me/photo", upload("avatar"), usersController.uploadAvatar);

/**
 * @swagger
 * /api/v1/users/me/pin:
 *   patch:
 *     summary: Change PIN
 *     description: Updates the user's security PIN after verifying the current one.
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
 *       200: { description: PIN changed successfully. }
 *       401: { description: Current PIN verification failed. }
 */
router.patch("/me/pin", validate(changePinSchema), usersController.changeMyPin);

// ── MERCHANT / FINANCIAL ────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/users/me/payment-details:
 *   post:
 *     summary: Configure payment details
 *     description: Sets up merchant split payment configuration (Paystack).
 *     tags: [Merchant Ledger]
 *     security:
 *       - BearerAuth: []
 *     x-rbac-roles: [farmer, transporter]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PaymentDetailsDto'
 *     responses:
 *       200: { description: Payment details configured successfully. }
 *       403: { description: Forbidden - Insufficient role. }
 *       409: { description: Payment details already configured. }
 */
router.post(
  "/me/payment-details",
  authorizeRoles(UserRole.FARMER, UserRole.TRANSPORTER),
  validate(paymentDetailsSchema),
  usersController.configurePaymentDetails,
);

/**
 * @swagger
 * /api/v1/users/me/earnings:
 *   get:
 *     summary: Get earnings & performance metrics
 *     description: Returns aggregated earnings and transaction metrics for the current operator.
 *     tags: [Merchant Ledger]
 *     security:
 *       - BearerAuth: []
 *     x-rbac-roles: [farmer, transporter]
 *     responses:
 *       200: { description: Metrics retrieved successfully. }
 *       403: { description: Forbidden - Insufficient role. }
 */
router.get(
  "/me/earnings",
  authorizeRoles(UserRole.FARMER, UserRole.TRANSPORTER),
  usersController.getMyEarnings,
);

// ── PUBLIC PROFILES ─────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get public user profile
 *     description: Retrieves a public-facing profile (limited PII).
 *     tags: [Users Profile]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200: { description: Public profile retrieved successfully. }
 *       404: { description: User not found. }
 */
router.get("/:id", usersController.getPublicProfile);

// ── AGENT MANAGEMENT ────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/users/agent/clients:
 *   post:
 *     summary: Register managed client
 *     description: Creates a new offline client under the current agent.
 *     tags: [Agent Management]
 *     security:
 *       - BearerAuth: []
 *     x-rbac-roles: [agent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterClientDto'
 *     responses:
 *       201: { description: Client registered successfully. }
 *       403: { description: Forbidden - Agent role required. }
 *       409: { description: Client already exists. }
 */
router.post(
  "/agent/clients",
  authorizeRoles(UserRole.AGENT),
  validate(registerClientSchema),
  usersController.registerManagedClient,
);

/**
 * @swagger
 * /api/v1/users/agent/clients:
 *   get:
 *     summary: List managed clients
 *     description: Returns a paginated list of clients assigned to the current agent.
 *     tags: [Agent Management]
 *     security:
 *       - BearerAuth: []
 *     x-rbac-roles: [agent]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200: { description: Paginated clients list. }
 */
router.get(
  "/agent/clients",
  authorizeRoles(UserRole.AGENT),
  validate(paginationSchema, "query"),
  usersController.getMyManagedClients,
);

/**
 * @swagger
 * /api/v1/users/agent/clients/{id}/unassign:
 *   patch:
 *     summary: Unassign managed client
 *     description: Removes the management relationship between agent and client.
 *     tags: [Agent Management]
 *     security:
 *       - BearerAuth: []
 *     x-rbac-roles: [agent]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200: { description: Client unassigned successfully. }
 *       404: { description: Assignment not found. }
 */
router.patch(
  "/agent/clients/:id/unassign",
  authorizeRoles(UserRole.AGENT),
  usersController.unassignManagedClient,
);

export { router as usersRouter };

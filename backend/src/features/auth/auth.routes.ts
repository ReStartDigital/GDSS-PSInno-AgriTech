import { Router } from "express";

import { AuthController } from "./auth.controller.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import { authRateLimiter } from "../../common/middleware/rate-limit.middleware.js";
import { requireRegistrationToken } from "../../common/middleware/registration-token.middleware.js";
import { asyncHandler } from "../../common/utils/async-handler.util.js";

import {
  registerSchema,
  verifyOtpSchema,
  setPinSchema,
  loginSchema,
} from "./auth.schemas.js";

const router = Router();
const controller = new AuthController();

/* ========================================
   AUTH ROUTES - Mobile Onboarding Flow
   ======================================== */

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Mobile-first user onboarding via Arkesel SMS and stateful Redis sessions.
 */

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Step 1 - Initiate or Resume User Onboarding
 *     description: Triggers an OTP code dispatch via Arkesel SMS and registers an unverified profile record inside PostgreSQL.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, firstName, lastName, role]
 *             properties:
 *               phone: { type: string, example: "+233240000000" }
 *               firstName: { type: string, example: "Abena" }
 *               middleName: { type: string, nullable: true, example: "Asare" }
 *               lastName: { type: string, example: "Mensah" }
 *               role:
 *                 type: string
 *                 enum: [farmer, buyer, transporter, agent]
 *                 example: "farmer"
 *               email: { type: string, nullable: true, example: "abena@vegelink.app" }
 *               location:
 *                 type: object
 *                 nullable: true
 *                 required: [longitude, latitude]
 *                 properties:
 *                   longitude: { type: number, example: -0.0194 }
 *                   latitude: { type: number, example: 5.7023 }
 *     responses:
 *       200:
 *         description: Challenge code dispatched successfully.
 *       409: { description: Phone number is already linked to an active account. }
 *       422: { description: Validation failed or gateway pipeline error. }
 *       429: { description: Rate limit exceeded or SMS cooling lock active. }
 */
router.post(
  "/register",
  authRateLimiter,
  validate(registerSchema),
  asyncHandler(controller.register)
);

/**
 * @swagger
 * /api/v1/auth/verify-otp:
 *   post:
 *     summary: Step 2 - Verify Carrier OTP Code
 *     description: Validates device possession context against active Redis cache challenges. Emits a temporary short-lived registration token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone: { type: string, example: "+233240000000" }
 *               otp: { type: string, example: "123456" }
 *     responses:
 *       200:
 *         description: Device identity established successfully.
 *       410: { description: Code has expired or reference missing from Redis. }
 *       422: { description: Invalid OTP supplied. }
 *       429: { description: Max validation attempts exceeded. }
 */
router.post(
  "/verify-otp",
  authRateLimiter,
  validate(verifyOtpSchema),
  asyncHandler(controller.verifyOtp)
);

/**
 * @swagger
 * /api/v1/auth/set-pin:
 *   post:
 *     summary: Step 3 - Finalize Account Registration
 *     description: Encrypts incoming credential lock parameters and commits a whitelist state in Redis.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [pin]
 *             properties:
 *               pin: { type: string, example: "1234" }
 *     responses:
 *       201:
 *         description: Profile setup finalized.
 *       401: { description: Missing or expired temporary registration context token header. }
 */
router.post(
  "/set-pin",
  requireRegistrationToken,
  validate(setPinSchema),
  asyncHandler(controller.setPin)
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Device Credentials Authentication Login
 *     description: Validates phone and hashed PIN matching rules. Tracks an active mobile session identifier inside Redis.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, pin]
 *             properties:
 *               phone: { type: string, example: "+233240000000" }
 *               pin: { type: string, example: "1234" }
 *     responses:
 *       200: { description: Authenticated cleanly. }
 *       401: { description: Invalid user credentials configuration. }
 */
router.post(
  "/login",
  authRateLimiter,           // Good practice to rate-limit login too
  validate(loginSchema),
  asyncHandler(controller.login)
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Rotate Native Mobile Client Session Token
 *     description: Swaps an opaque refresh token for a brand new secure token session pair.
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string, example: "opaque-random-refresh-string" }
 *     responses:
 *       200: { description: Token session pair rotated successfully. }
 *       401: { description: Refresh token missing, expired, or rejected. }
 */
router.post("/refresh", asyncHandler(controller.refresh));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Terminate Application Session Lifecycle
 *     description: Instantly drops the session whitelist registration reference from Redis.
 *     tags: [Authentication]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken: { type: string, example: "opaque-random-refresh-string" }
 *     responses:
 *       200: { description: Session references cleared successfully. }
 */
router.post("/logout", asyncHandler(controller.logout));

export { router as authRouter };
import { Router } from "express";
import { RatingsController } from "./ratings.controller.js";
import { RatingsRepository } from "./ratings.repository.js";
import { authenticate } from "../../common/middleware/authenticate.middleware.js";
import { OrdersService } from "../orders/orders.service.js";
import { RatingsService } from "./ratings.service.js";
import { AppDataSource } from "../../config/database.config.js";
import { ListingsRepository } from "../listings/listings.repository.js";
import { OrdersRepository } from "../orders/orders.repository.js";
import { UserRepository } from "../user/user.repository.js";

const ratingsRouter = Router();

// Instantiate dependecy tree variables manually matching your pattern

const ordersRepo = new OrdersRepository(AppDataSource);
const listingsRepo = new ListingsRepository();
const usersRepo = new UserRepository();
const ordersService = new OrdersService(
  ordersRepo,
  listingsRepo,
  usersRepo,
  AppDataSource,
);
const ratingsRepo = new RatingsRepository();

// Reuses your existing ordersService context
const ratingsService = new RatingsService(ratingsRepo, ordersService);
const controller = new RatingsController(ratingsService);

/**
 * @openapi
 * /api/v1/ratings:
 *   post:
 *     summary: Submit an order transaction review
 *     description: Log a whole-number score (1-5) and an optional comment targeting a counter-party of a finalized (DELIVERED or PICKED_UP) transaction order. Synchronizes aggregate score profiles on the ratee user account.
 *     tags:
 *       - Ratings
 *     access: Private (Authenticated Buyers or Farmers)
 *     middleware: [authenticate]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order_id
 *               - ratee_id
 *               - score
 *             properties:
 *               order_id:
 *                 type: string
 *                 format: uuid
 *                 description: Unique identifier of the finalized order
 *               ratee_id:
 *                 type: string
 *                 format: uuid
 *                 description: Unique identifier of the counter-party user being rated
 *               score:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Whole number rating rating from 1 to 5 stars
 *               comment:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Optional textual feedback review string
 *     responses:
 *       201:
 *         description: Review recorded and metrics updated successfully
 *       400:
 *         description: Order has not been finalized or target is not a valid participant to the contract
 *       409:
 *         description: Double-rating conflict attempt detected for this order tracking sequence
 */
ratingsRouter.post("/", authenticate, controller.submitReview);

/**
 * @openapi
 * /api/v1/ratings/me:
 *   get:
 *     summary: Get contextual user review history feeds
 *     description: Returns a paginated list of reviews either authored by the authenticated caller or received by them from marketplace counterparties.
 *     tags:
 *       - Ratings
 *     access: Private (All Authenticated Users)
 *     middleware: [authenticate]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page offset multiplier pointer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 100
 *           default: 20
 *         description: Total rows to yield per execution slice
 *       - in: query
 *         name: direction
 *         schema:
 *           type: string
 *           enum: [given, received]
 *           default: received
 *         description: Filter direction indicating reviews written by the user ('given') versus written about them ('received')
 *     responses:
 *       200:
 *         description: Paginated ratings dataset successfully retrieved and sanitized
 *       401:
 *         description: Request lacks valid signature authorization credentials
 */
ratingsRouter.get("/me", authenticate, controller.getMyReviews);

export { ratingsRouter };

import { Router } from "express";
import { listingsController } from "./listings.controller.js";
import { authenticate } from "../../common/middleware/authenticate.middleware.js";
import { authorize } from "../../common/middleware/authorization.middleware.js";
import { validate } from "../../common/middleware/validate.middleware.js";
import { generalRateLimiter } from "../../common/middleware/rate-limit.middleware.js";
import {
  uploadSingleImage,
  handleMulterError,
} from "../../common/middleware/upload.middleware.js";
import { UserRole } from "../../common/constants/roles.enums.js";
import {
  createListingSchema,
  updateListingSchema,
  listingsQuerySchema,
  packagingRecommendSchema,
} from "./listings.schema.js";

const router = Router();
router.use(generalRateLimiter);

// ─────────────────────────────────────────────────────────────────────────────
// NOTE ON ROUTE ORDER
// Express matches routes top-to-bottom. Static segments (/images, /packaging/recommend)
// MUST be declared before parameterised routes (/:id) so that
// GET /api/v1/listings/images and GET /api/v1/listings/packaging/recommend
// are not swallowed by GET /api/v1/listings/:id.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/v1/listings/images:
 *   post:
 *     summary: Upload a listing image
 *     description: >
 *       Uploads an image to Cloudinary and returns the URL and thumbnail URL
 *       to include in the `images` array when creating or updating a listing.
 *       Each upload is a distinct Cloudinary asset (no overwriting).
 *       A listing can have a maximum of 8 images.
 *       Accepted formats: JPEG, PNG, WebP. Maximum size: 8MB.
 *       Available to farmers and agents only.
 *     tags: [Listings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file. JPEG, PNG, or WebP. Max 8MB.
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           format: uri
 *                           description: Full-resolution Cloudinary URL
 *                           example: https://res.cloudinary.com/vegelink/image/upload/v1/vegelink/api/v1/listings/abc123.webp
 *                         thumbnail_url:
 *                           type: string
 *                           format: uri
 *                           description: 300px-wide thumbnail derived from the same asset
 *                           example: https://res.cloudinary.com/vegelink/image/upload/w_300,c_fill/vegelink/api/v1/listings/abc123.webp
 *       400:
 *         description: Invalid file type or file too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               invalid_type:
 *                 value:
 *                   success: false
 *                   error:
 *                     code: INVALID_FILE_TYPE
 *                     message: Invalid file type "image/gif". Accepted types: JPEG, PNG, WebP.
 *               too_large:
 *                 value:
 *                   success: false
 *                   error:
 *                     code: FILE_TOO_LARGE
 *                     message: File is too large. Maximum size is 8 MB.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: Only farmers and agents can upload listing images
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  "/images",
  authenticate,
  authorize(UserRole.FARMER, UserRole.AGENT),
  uploadSingleImage("image"),
  handleMulterError,
  listingsController.uploadImage,
);

/**
 * @swagger
 * /api/v1/listings/packaging/recommend:
 *   get:
 *     summary: Get packaging recommendations for a vegetable type
 *     description: >
 *       Returns up to 3 packaging options best suited for the given vegetable
 *       type, ranked by protection level (high → medium → low). Each result
 *       includes a human-readable reason string explaining why it was
 *       recommended.
 *
 *       If no exact match is found in the packaging catalog for the given
 *       vegetable type, the top 2 general-purpose options are returned as
 *       a fallback.
 *
 *       This endpoint is called during listing creation to suggest the best
 *       packaging before the farmer submits the form.
 *     tags: [Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vegetable_type
 *         required: true
 *         schema:
 *           type: string
 *           example: tomatoes
 *         description: The vegetable type to get packaging recommendations for. Case-insensitive.
 *     responses:
 *       200:
 *         description: Packaging recommendations returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         recommendations:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/PackagingOption'
 *                               - type: object
 *                                 properties:
 *                                   reason:
 *                                     type: string
 *                                     example: "Recommended for tomatoes — high protection, 15kg capacity"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         description: vegetable_type query param is missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get(
  "/packaging/recommend",
  authenticate,
  validate(packagingRecommendSchema, "query"),
  listingsController.recommendPackaging,
);

/**
 * @swagger
 * /api/v1/listings:
 *   get:
 *     summary: Browse and search active produce listings
 *     description: >
 *       Returns a paginated list of active produce listings. Supports
 *       full-text search by vegetable type, price range filtering, minimum
 *       quantity filtering, packaging standard filtering, and
 *       PostGIS-powered geolocation radius search.
 *
 *       When `lat` and `lng` are provided, results are sorted by distance
 *       ascending (nearest farm first). Otherwise, results are sorted by
 *       created_at descending (newest first).
 *
 *       The `fulfilment_mode` filter narrows results to listings that
 *       explicitly support delivery, pickup, or both.
 *     tags: [Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: vegetable_type
 *         schema:
 *           type: string
 *           example: tomatoes
 *         description: Case-insensitive partial match on vegetable_type
 *       - in: query
 *         name: min_price_kg
 *         schema:
 *           type: number
 *           example: 3.50
 *         description: Minimum price per kg in GHS
 *       - in: query
 *         name: max_price_kg
 *         schema:
 *           type: number
 *           example: 10.00
 *         description: Maximum price per kg in GHS
 *       - in: query
 *         name: min_quantity_kg
 *         schema:
 *           type: number
 *           example: 10
 *         description: Minimum available quantity in kg
 *       - in: query
 *         name: packaging_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter to listings using this specific packaging option
 *       - in: query
 *         name: fulfilment_mode
 *         schema:
 *           type: string
 *           enum: [delivery, pickup, both]
 *           default: both
 *         description: Filter by supported fulfilment modes
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *           example: 5.6037
 *         description: Buyer latitude for radius search. Must be provided with lng.
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *           example: -0.1870
 *         description: Buyer longitude for radius search. Must be provided with lat.
 *       - in: query
 *         name: radius_km
 *         schema:
 *           type: number
 *           default: 15
 *           maximum: 200
 *         description: Search radius in kilometres. Only used when lat+lng provided.
 *       - in: query
 *         name: farmer_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter to listings by a specific farmer
 *     responses:
 *       200:
 *         description: Paginated listing feed returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         data:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/ListingSummary'
 *                         meta:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.get(
  "/",
  authenticate,
  validate(listingsQuerySchema, "query"),
  listingsController.browse,
);

/**
 * @swagger
 * /api/v1/listings:
 *   post:
 *     summary: Create a new produce listing
 *     description: >
 *       Creates a new active produce listing. Available to farmers and agents.
 *
 *       **Farmers** — the listing is created for themselves. `farmer_id` is
 *       ignored if provided.
 *
 *       **Agents** — must supply `farmer_id` referencing a farmer in their
 *       active client list. The listing belongs to the farmer, not the agent.
 *
 *       A packaging recommendation can be attached at creation time by
 *       supplying `recommended_packaging_id` (obtained from
 *       `GET /api/v1/listings/packaging/recommend`). If not supplied, the listing
 *       is created without a packaging recommendation.
 *
 *       `harvest_date` must be today or in the future. Images must be
 *       Cloudinary URLs obtained first from `POST /api/v1/listings/images`.
 *     tags: [Listings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateListingBody'
 *           examples:
 *             farmer_creates_own:
 *               summary: Farmer creating their own listing
 *               value:
 *                 vegetable_type: tomatoes
 *                 quantity_kg: 50
 *                 price_per_kg_ghs: 4.50
 *                 harvest_date: "2026-07-10"
 *                 images: []
 *                 recommended_packaging_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                 location:
 *                   lat: 5.6037
 *                   lng: -0.1870
 *                 supports_delivery: true
 *                 supports_pickup: true
 *             agent_creates_for_farmer:
 *               summary: Agent creating on behalf of farmer
 *               value:
 *                 farmer_id: "3fa85f64-5717-4562-b3fc-2c963f66afa6"
 *                 vegetable_type: peppers
 *                 quantity_kg: 30
 *                 price_per_kg_ghs: 6.00
 *                 harvest_date: "2026-07-12"
 *                 images: []
 *                 location:
 *                   lat: 5.6037
 *                   lng: -0.1870
 *                 supports_delivery: true
 *                 supports_pickup: false
 *     responses:
 *       201:
 *         description: Listing created successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         listing:
 *                           $ref: '#/components/schemas/ListingDetail'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         description: >
 *           Buyer or transporter attempting to create a listing.
 *           Or agent supplying a farmer_id not in their client list.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             examples:
 *               wrong_role:
 *                 value:
 *                   success: false
 *                   error:
 *                     code: FORBIDDEN
 *                     message: Only farmers and agents can create listings.
 *               agent_wrong_client:
 *                 value:
 *                   success: false
 *                   error:
 *                     code: FORBIDDEN
 *                     message: You can only manage listings for farmers in your client list.
 *       404:
 *         description: Packaging option not found or inactive
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.post(
  "/",
  authenticate,
  authorize(UserRole.FARMER, UserRole.AGENT),
  validate(createListingSchema),
  listingsController.create,
);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   get:
 *     summary: Get a single listing by ID
 *     description: >
 *       Returns full listing detail including the farmer's public profile and
 *       the recommended packaging option. Available to any authenticated user.
 *       Returns 404 for listings in any status (active, sold, or cancelled) —
 *       the listing detail screen always shows the current state.
 *     tags: [Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Listing UUID
 *     responses:
 *       200:
 *         description: Listing detail returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         listing:
 *                           $ref: '#/components/schemas/ListingDetail'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get("/:id", authenticate, listingsController.getById);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   patch:
 *     summary: Update a listing
 *     description: >
 *       Updates one or more fields on a listing. At least one field must be
 *       provided.
 *
 *       **Ownership rules:** Farmers can only update their own listings.
 *       Agents can only update listings belonging to farmers in their active
 *       client list.
 *
 *       **Active order restriction:** `quantity_kg` and `price_per_kg_ghs`
 *       cannot be changed while an active order exists on this listing.
 *       All other fields can be updated freely.
 *
 *       **Fulfilment mode restriction:** At least one of `supports_delivery`
 *       or `supports_pickup` must remain true after the update.
 *
 *       To cancel a listing, set `status: "cancelled"`.
 *     tags: [Listings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateListingBody'
 *     responses:
 *       200:
 *         description: Listing updated and full updated record returned
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         listing:
 *                           $ref: '#/components/schemas/ListingDetail'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Cannot change quantity or price while an active order exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               success: false
 *               error:
 *                 code: LISTING_HAS_ACTIVE_ORDER
 *                 message: Cannot update quantity or price while an active order exists on this listing.
 *       422:
 *         $ref: '#/components/responses/ValidationError'
 */
router.patch(
  "/:id",
  authenticate,
  authorize(UserRole.FARMER, UserRole.AGENT),
  validate(updateListingSchema),
  listingsController.update,
);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   delete:
 *     summary: Cancel (soft-delete) a listing
 *     description: >
 *       Cancels a listing by setting its status to `cancelled`. This is a
 *       soft delete — the listing record is never removed from the database,
 *       preserving order history integrity.
 *
 *       A listing cannot be cancelled if it has any active order (status not
 *       in: cancelled, cancelled_expired, delivered, collected). Cancel the
 *       order first, then cancel the listing.
 *
 *       **Ownership rules:** Same as PATCH — farmers own their listings,
 *       agents can cancel on behalf of their clients.
 *     tags: [Listings]
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
 *         description: Listing cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiSuccess'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         message:
 *                           type: string
 *                           example: Listing cancelled successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       409:
 *         description: Listing has an active order and cannot be cancelled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *             example:
 *               success: false
 *               error:
 *                 code: LISTING_HAS_ACTIVE_ORDER
 *                 message: Cannot delete a listing that has an active order. Cancel the order first.
 */
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.FARMER, UserRole.AGENT),
  listingsController.remove,
);

export { router as listingsRouter };

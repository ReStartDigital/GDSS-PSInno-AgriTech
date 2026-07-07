import { z } from "zod";

/**
 * Validates incoming payload data required to post a new transaction review
 */
export const createRatingSchema = z.object({
  order_id: z.string().uuid("A valid order reference code is required"),
  ratee_id: z.string().uuid("A valid recipient profile identifier is required"),

  // Maps strictly to your SQL SMALLINT CHECK constraint
  score: z
    .number()
    .int("Rating score must be a whole number")
    .min(1, "Rating must be at least 1 star")
    .max(5, "Rating cannot exceed 5 stars"),

  comment: z
    .string()
    .trim()
    .max(1000, "Comments must remain within 1000 characters")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
});

/**
 * Validates query pagination criteria for looking up public score profiles
 */
export const getRatingsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),

  // Context modifier to pull reviews written *by* the user vs *about* the user
  direction: z.enum(["given", "received"]).default("received"),
});

export type CreateRatingDto = z.infer<typeof createRatingSchema>;
export type GetRatingsQueryDto = z.infer<typeof getRatingsQuerySchema>;

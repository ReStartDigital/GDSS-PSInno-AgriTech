import { z } from "zod";

// Coordinates schema ensuring precise lat/lng values
const coordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export const createTransportRequestSchema = z.object({
  order_id: z.string().uuid("A valid order reference code is required."),
  pickup_location: coordinateSchema,
  dropoff_location: coordinateSchema,
  packaging_type_name: z
    .string()
    .trim()
    .min(1, "Packaging type description is required.")
    .max(255),
  special_handling: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .transform((val) => val || undefined),
});

export const browseAvailableJobsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  // Optional geo-fencing parameter to find jobs close to a transporter's current location
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  radius_km: z.coerce.number().positive().max(500).default(50),
});

export const confirmDeliverySchema = z.object({
  // The unique verification token provided by the buyer at the drop-off site
  verification_pin: z.string().trim().min(4).max(8),
});

export type ConfirmDeliveryDto = z.infer<typeof confirmDeliverySchema>;
export type CreateTransportRequestDto = z.infer<
  typeof createTransportRequestSchema
>;
export type BrowseAvailableJobsDto = z.infer<typeof browseAvailableJobsSchema>;

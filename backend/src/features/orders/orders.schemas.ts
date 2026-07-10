import { z } from "zod";
import { FulfilmentMode } from "../../common/constants/roles.enums.js";

/**
 * Base coordinates for delivery drop-off tracking
 */
const locationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Validates incoming payload when a buyer initiates a checkout
 */
export const createOrderSchema = z
  .object({
    listing_id: z.string().uuid("Invalid listing identifier"),
    quantity_kg: z.number().positive("Quantity must be greater than 0"),

    mode: z.nativeEnum(FulfilmentMode).default(FulfilmentMode.DELIVERY),

    // Aligned to match the raw migration database constraints
    delivery_address: z
      .string()
      .trim()
      .min(5, "Address is too short")
      .optional()
      .nullable(),
    delivery_location: locationSchema.optional().nullable(),

    // Optional metadata tracking hook
    packaging_type_id: z.string().uuid().optional().nullable(),
    packaging_type_name: z.string().trim().max(255).optional(),
    special_handling: z.string().trim().max(1000).optional(),
  })
  .refine(
    (data) => {
      if (data.mode === FulfilmentMode.DELIVERY) {
        return !!data.delivery_address;
      }
      return true;
    },
    {
      message:
        "Delivery address is required when fulfilment mode is set to delivery",
      path: ["delivery_address"],
    },
  );

/**
 * Validates state updates that require an administrative or user-facing reason
 */
export const declineOrderSchema = z.object({
  decline_reason: z
    .string()
    .trim()
    .min(4, "Please provide a clear reason for declining"),
});

export const cancelOrderSchema = z.object({
  cancellation_reason: z
    .string()
    .trim()
    .min(4, "Please provide a reason for cancellation"),
});

/**
 * Validates a pricing counter-offer request
 */
export const negotiateOrderSchema = z.object({
  counter_price_per_kg_ghs: z
    .number()
    .positive("Counter-offer price must be greater than 0"),
});

// Type definitions inferred directly from schemas
export type CreateOrderDto = z.infer<typeof createOrderSchema>;
export type DeclineOrderDto = z.infer<typeof declineOrderSchema>;
export type CancelOrderDto = z.infer<typeof cancelOrderSchema>;
export type NegotiateOrderDto = z.infer<typeof negotiateOrderSchema>;

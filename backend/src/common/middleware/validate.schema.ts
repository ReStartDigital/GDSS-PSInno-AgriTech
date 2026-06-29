import { z, ZodError } from "zod"; // 🔑 Removed AnyZodObject from here
import type { Response } from "express";
import logger from "../utils/logger.js";

// =========================================================================
// 🛠️ UTILITIES & GLOBAL ERROR HANDLING HANDLERS
// =========================================================================

export const handleControllerError = (
  error: unknown,
  res: Response,
  context: string,
) => {
  if (error instanceof ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: error.flatten().fieldErrors,
    });
  }

  logger.error(`${context} Controller Error:`, error);

  return res.status(500).json({
    status: "error",
    message: "An internal server error occurred",
    ...(process.env.NODE_ENV === "development" && {
      debug: error instanceof Error ? error.message : String(error),
    }),
  });
};

// =========================================================================
// 📐 REUSABLE VALIDATION RULES (RULES)
// =========================================================================

const phoneRules = z
  .string({ message: "Phone number is required" })
  .trim()
  .min(10, { message: "Must be a valid mobile number" })
  .max(14, { message: "Must be a valid mobile number" });

const emailRules = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address format" })
  .optional()
  .nullable();

// PostGIS MVP Point tracking format wrapper (expects: "lng,lat" or structural GeoJSON)
const locationRules = z
  .string()
  .trim()
  .regex(/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/, {
    message:
      "Location must be a comma-separated coordinate string (e.g., '1.234,-0.123')",
  })
  .optional()
  .nullable();

// =========================================================================
// 🗂️ SCHEMA CONFIGURATIONS
// =========================================================================

export const loginSchema = z.object({
  body: z.object({
    phone: phoneRules,
    pin: z
      .string({ message: "PIN security code is required" })
      .min(6, { message: "PIN must be at least 6 digits long" }),
  }),
});

export const sendOtpSchema = z.object({
  body: z.object({
    telephone: phoneRules,
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    otp: z
      .string({ message: "OTP code is required" })
      .trim()
      .min(6, { message: "OTP must be at least 6 digits" })
      .max(8, { message: "OTP cannot exceed 8 digits" }),
     pin: z
      .string({ message: "PIN security code is required" })
      .min(6, { message: "PIN must be at least 6 digits long" }),
    phone: phoneRules,
  }),
});

export const registerSchema = z.object({
  body: z.object({
    phone: phoneRules,
    first_name: z.string().trim().min(1, { message: "First name is required" }),
    middle_name: z.string().trim().optional().nullable(),
    last_name: z.string().trim().min(1, { message: "Last name is required" }),
    pin: z
      .string({ message: "PIN security code is required" })
      .min(6, { message: "PIN must be at least 6 digits long" }), // 🛠️ Fixed broken .minLength reference
    email: emailRules,
    location: locationRules,
    role: z.enum(["farmer", "buyer", "transporter","agent"]).default("buyer"), // Enforce defined domain roles explicitly
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    accessToken: z
      .string({ message: "Access token is required" })
      .trim()
      .min(1, { message: "Access token cannot be empty" }),
    refreshToken: z
      .string({ message: "Refresh token is required" })
      .trim()
      .min(1, { message: "Refresh token cannot be empty" }),
  }),
});

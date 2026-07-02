import swaggerJsdoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getSafeGlobPath = (...args: string[]) => {
  return path.join(...args).replace(/\\/g, "/");
};

const SWAGGER_URL = process.env.SWAGGER_URL || "http://localhost:3000";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "VegeLink Ghana API",
      version: "1.0.0",
      description: "Farmer-to-Buyer Digital Marketplace Platform with Integrated Logistics",
    },
    servers: [{ url: SWAGGER_URL }],
    components: {
      securitySchemes: {
        BearerAuth: { // ✨ Normalized to CamelCase to exactly match common headers layout
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
      // ✨ Schema placeholders to prevent reference errors when scanning routes
      schemas: {
        UpdateProfileDto: { type: "object" },
        ChangePinDto: { type: "object" },
        PaymentDetailsDto: { type: "object" },
        RegisterClientDto: { type: "object" },
      },
    },
  },
  // Scans features accurately across local TypeScript runtime vs Docker deployment JS runtimes
  apis: [
    getSafeGlobPath(__dirname, "../features/**/*.ts"),
    getSafeGlobPath(__dirname, "../features/**/*.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

// Automatically sync file cache updates cleanly on hot reload boots
fs.writeFileSync("./swagger-output.json", JSON.stringify(swaggerSpec, null, 2));
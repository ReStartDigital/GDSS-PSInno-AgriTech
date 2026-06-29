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
      title: "VegeLink Ghana",
      version: "1.0.0",
      description: "Farmer-to-Buyer Digital Marketplace Platform",
    },
    servers: [{ url: SWAGGER_URL }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT", // optional, but recommended
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  // Scans the current directory's parent for controllers and the app file
  apis: [
    getSafeGlobPath(__dirname, "../features/**/*.ts"), 
    getSafeGlobPath(__dirname, "../features/**/*.js"),
  ],
};

export const swaggerSpec = swaggerJsdoc(options);
fs.writeFileSync("./swagger-output.json", JSON.stringify(swaggerSpec, null, 2));
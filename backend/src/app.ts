import  type { Request, Response} from "express"
import express from "express";
import cors from "cors";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import * as dotenv from "dotenv";
import morganMiddleware from "./common/middleware/morgan.middleware.js";

import health_router from "./features/health/health.router.js";
dotenv.config();

const app = express();

app.use(morganMiddleware);

// 1. Professional CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? [];

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // ALLOW REQUEST WITH NO ORIGIN
      if(!origin) return callback(null, true);

      if(allowedOrigins.indexOf(origin) != -1){
        callback(null, true);
      }else{
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }),
);

// app.use(requestMiddleware);

// 2. Swagger Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health Endpoint
app.use("/api/health", health_router);

export default app;
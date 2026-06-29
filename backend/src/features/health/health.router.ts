import { Router } from "express";
import { GetHelath } from "./health.controller.js";

const router = Router();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     responses:
 *       200:
 *         description: Server is healthy
 */
router.get("", GetHelath);

export default router;
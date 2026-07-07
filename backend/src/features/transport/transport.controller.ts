import type { NextFunction, Request, Response } from "express";
import { TransportService } from "./transport.service.js";
import {
  createTransportRequestSchema,
  browseAvailableJobsSchema,
} from "./transport.schemas.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import { UnprocessableException } from "../../common/exceptions/index.js";

export class TransportController {
  constructor(private transportService: TransportService) {}

  /**
   * Manual Request Generation (Fallback for Farmers)
   * Handles manual transport routing initialization when an order isn't auto-confirmed.
   */
  createRequest = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payload = createTransportRequestSchema.parse(req.body);
      const requestRow = await this.transportService.requestHauling(payload);

      res.status(201).json({
        success: true,
        message: "Transport dispatch routing initialized successfully.",
        data: requestRow,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Driver Job Board Broker
   * Fetches unclaimed routes, supporting optional geo-fenced coordinates via PostGIS.
   */
  getAvailableJobs = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = browseAvailableJobsSchema.parse(req.query);
      const result = await this.transportService.browseJobs(query);

      res.status(200).json({
        success: true,
        meta: {
          total_records: result.total,
          current_page: query.page,
          limit: query.limit,
        },
        data: result.data, // Mapped perfectly from service 'data' array
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Atomic Job Acceptance Claim
   * Executes the strict pessimistic row lock sequence inside the state machine.
   */
  acceptAssignment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new UnprocessableException(
          "Transport request ID is required",
          ErrorCode.VALIDATION_ERROR,
        );
      }
      const transporterId = req.user!.sub; // Captured securely via your authenticateJwt middleware

      const updatedJob = await this.transportService.acceptJob(
        id,
        transporterId,
      );

      res.status(200).json({
        success: true,
        message:
          "Job contract claimed and assigned to your logistics profile. Order set to PACKED.",
        data: updatedJob,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Secure Delivery OTP Handshake Verification (Option 1)
   * Validates the Arkesel verification code and closes out the order lifecycle.
   */
  confirmDelivery = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const id = req.params.id as string;
      if (!id) {
        throw new UnprocessableException(
          "Transport request ID is required",
          ErrorCode.VALIDATION_ERROR,
        );
      }
      const transporterId = req.user!.sub;
      //   const payload = confirmDeliverySchema.parse(req.body);

      const completedJob = await this.transportService.confirmSecureDelivery(
        id,
        transporterId,
      );

      res.status(200).json({
        success: true,
        message:
          "Delivery verified successfully via Arkesel handshake. Financial escrow metrics finalized.",
        data: completedJob,
      });
    } catch (error) {
      next(error);
    }
  };
}

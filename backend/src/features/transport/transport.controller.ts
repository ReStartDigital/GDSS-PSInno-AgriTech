import type { NextFunction, Request, Response } from "express";
import { TransportService } from "./transport.service.js";
import {
  createTransportRequestSchema,
  browseAvailableJobsSchema,
} from "./transport.schemas.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import { UnprocessableException } from "../../common/exceptions/index.js";
import { confirmDeliverySchema } from "./transport.schemas.js";
import { HttpStatusCode } from "axios";

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
      const validatedBody = await confirmDeliverySchema.parseAsync(req.body);

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
        validatedBody,
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

  /**
   * STEP 1: DOORSTEP ARRIVAL CHECK-IN
   * Triggered when the driver is physically standing at the doorstep.
   * Updates state to 'en_route' and initiates the strict 6-minute Arkesel OTP.
   */
  triggerDoorstepArrival = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const requestId = req.params.id as string;

      // Assumes your 'authenticate' middleware attaches the user profile to req.user
      const transporterId = req.user?.sub as string;

      if (!requestId || transporterId) {
        throw new UnprocessableException(
          "Both Transport Request ID and Transporter authentication token are required.",
          ErrorCode.VALIDATION_ERROR,
        );
      }
      const updatedRequest = await this.transportService.triggerDoorstepArrival(
        requestId,
        transporterId,
      );

      res.status(HttpStatusCode.Ok).json({
        success: true,
        message:
          "Doorstep arrival registered. A 6-minute verification code has been dispatched to the buyer.",
        data: updatedRequest,
      });
    } catch (error) {
      // Passes network failures or bad state transition errors directly to global error handler
      next(error);
    }
  };
}

import { type Request, type Response } from "express";
import { usersService } from "./users.service.js";
import { sendSuccess } from "../../common/dto/api-response.dto.js";
import { UnprocessableException } from "../../common/exceptions/index.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import type {
  UpdateProfileDto,
  ChangePinDto,
  PaymentDetailsDto,
  RegisterClientDto,
  PaginationDto,
} from "./users.schemas.js";

export class UsersController {
  // ── OWN PROFILE OPERATIONS ─────────────────────────────────────────────────

  async getMyProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.sub;
    const profile = await usersService.getPrivateProfile(userId);

    sendSuccess(res, { user: profile });
  }

  async updateMyProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.sub;
    const dto = req.validatedData as UpdateProfileDto;

    const updatedProfile = await usersService.updateProfile(userId, dto);
    // ✨ Fixed: Moved message into the data payload to match (res, data, statusCode)
    sendSuccess(res, {
      user: updatedProfile,
      message: "Profile updated successfully.",
    });
  }

  async changeMyPin(req: Request, res: Response): Promise<void> {
    const userId = req.user!.sub;
    const dto = req.validatedData as ChangePinDto;

    await usersService.changePin(userId, dto);
    // ✨ Fixed: Passed message inside the data object
    sendSuccess(res, { message: "PIN changed successfully." });
  }

  async uploadAvatar(req: Request, res: Response): Promise<void> {
    const userId = req.user!.sub;

    if (!req.file) {
      throw new UnprocessableException(
        "No image file stream asset was detected on the incoming request multiparts.",
        ErrorCode.VALIDATION_ERROR,
      );
    }

    const output = await usersService.uploadProfilePhoto(
      userId,
      req.file.buffer,
    );
    // ✨ Fixed: Passed message inside the data object
    sendSuccess(res, {
      ...output,
      message: "Avatar image uploaded successfully.",
    });
  }

  async configurePaymentDetails(req: Request, res: Response): Promise<void> {
    const userId = req.user!.sub;
    const dto = req.validatedData as PaymentDetailsDto;

    await usersService.setupPaymentDetails(userId, dto);
    // ✨ Fixed: Passed message inside the data object
    sendSuccess(res, {
      message:
        "Merchant distribution settlement ledger provisioned successfully.",
    });
  }

  async getMyEarnings(req: Request, res: Response): Promise<void> {
    const userId = req.user!.sub;
    const summary = await usersService.getEarningsSummary(userId);

    sendSuccess(res, summary);
  }

  // ── PUBLIC PROFILE OPERATIONS ──────────────────────────────────────────────

  async getPublicProfile(req: Request, res: Response): Promise<void> {
    const targetUserId = req.params.id;
    if (!targetUserId || typeof targetUserId !== "string") {
      throw new UnprocessableException(
        "The requested user identifier parameter is missing or malformed.",
        ErrorCode.VALIDATION_ERROR,
      );
    }
    const publicProfile = await usersService.getPublicProfile(targetUserId);

    sendSuccess(res, { user: publicProfile });
  }

  // ── PROXY AGENT MANAGEMENT ACTIONS ─────────────────────────────────────────

  async registerManagedClient(req: Request, res: Response): Promise<void> {
    const agentId = req.user!.sub;
    const dto = req.validatedData as RegisterClientDto;

    const clientRecord = await usersService.registerClient(agentId, dto);
    // ✨ Fixed: Passed message inside data, and 201 cleanly into the 3rd parameter slot
    sendSuccess(
      res,
      {
        user: clientRecord,
        message: "Client application profile created and bound successfully.",
      },
      201,
    );
  }

  async getMyManagedClients(req: Request, res: Response): Promise<void> {
    const agentId = req.user!.sub;
    const pagination = req.validatedData as PaginationDto;

    const results = await usersService.getAgentClients(agentId, pagination);
    sendSuccess(res, results);
  }

  async unassignManagedClient(req: Request, res: Response): Promise<void> {
    const agentId = req.user!.sub;
    const clientId = req.params.id;

    if (!clientId || typeof clientId !== "string") {
      throw new UnprocessableException(
        "The requested user identifier parameter is missing or malformed.",
        ErrorCode.VALIDATION_ERROR,
      );
    }
    await usersService.unassignClient(agentId, clientId);
    // ✨ Fixed: Passed message inside the data object
    sendSuccess(res, {
      message: "Client management mapping tracking card unlinked cleanly.",
    });
  }
}

export const usersController = new UsersController();
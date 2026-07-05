import type { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service.js";
import * as ApiResponse from "../../common/dto/api-response.dto.js";
import { AppException } from "../../common/exceptions/app.exceptions.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";
import { AUTH_CONSTANTS } from "../../common/constants/auth.constants.js";
import type {
  RegisterDto,
  VerifyOtpDto,
  SetPinDto,
  LoginDto,
  ResendOtpDto,
} from "./auth.schemas.js";

const isProduction = process.env.NODE_ENV === "production";
const REFRESH_COOKIE_NAME = "vegelink_refresh_token";

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  sameSite: "strict" as const,
  maxAge: AUTH_CONSTANTS.REFRESH_TOKEN.EXPIRY_SECONDS * 1000,
  path: "/api/v1/auth", // Scoped exclusively to the authentication subsystem boundary
};

export class AuthController {
  private authService = new AuthService();

  /**
   * STEP 1 — POST /auth/register
   * Hands pre-validated inputs directly to the service to coordinate OTP routing.
   */
  public register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.body as RegisterDto;
      const result = await this.authService.register(dto);

      ApiResponse.sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  /** POST /auth/resend-otp */
  public resendOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.body as ResendOtpDto;
      const result = await this.authService.resendOtp(dto);
      ApiResponse.sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * STEP 2 — POST /auth/verify-otp
   * Evaluates phone verification. Emits temporary token sequence context out over response body.
   */
  public verifyOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.body as VerifyOtpDto;
      const result = await this.authService.verifyOtp(dto);

      ApiResponse.sendSuccess(res, result, 200);
    } catch (error) {
      next(error);
    }
  };

  /**
   * STEP 3 — POST /auth/set-pin
   * Secured by temporary token verification layer middleware. Establishes login credentials.
   */
  public setPin = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.body as SetPinDto;
      const phone = req.registration?.phone;

      if (!phone) {
        throw new AppException(
          401,
          ErrorCode.UNAUTHORIZED,
          "Missing or expired registration token context.",
        );
      }

      const result = await this.authService.setPin(phone, dto);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        REFRESH_COOKIE_OPTIONS,
      );
      ApiResponse.sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken },
        201,
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/login
   * Validates matching credentials and links long-lived secure cookies.
   */
  public login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = req.body as LoginDto;
      const result = await this.authService.login(dto);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        REFRESH_COOKIE_OPTIONS,
      );
      ApiResponse.sendSuccess(
        res,
        { user: result.user, accessToken: result.accessToken },
        200,
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/refresh
   * Rotates token access pairs securely.
   */
  public refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const rawRefreshToken =
        req.cookies?.[REFRESH_COOKIE_NAME] ||
        req.headers["x-refresh-token"] ||
        req.body.refreshToken;
      const result = await this.authService.refresh(rawRefreshToken);

      res.cookie(
        REFRESH_COOKIE_NAME,
        result.refreshToken,
        REFRESH_COOKIE_OPTIONS,
      );
      ApiResponse.sendSuccess(
        res,
        { accessToken: result.accessToken, refreshToken: result.refreshToken },
        200,
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /auth/logout
   * Sweeps token references and flushes security cookies cleanly.
   */
  public logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const rawRefreshToken = req.cookies?.[REFRESH_COOKIE_NAME];
      await this.authService.logout(rawRefreshToken);

      res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
      ApiResponse.sendSuccess(
        res,
        { message: "Logged out successfully." },
        200,
      );
    } catch (error) {
      next(error);
    }
  };
}

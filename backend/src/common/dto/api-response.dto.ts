import type { Response } from "express";
import { ErrorCode } from "../constants/error-codes.enum.js";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: Record<string, string[]> | undefined;
  };
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
): Response {
  const body: ApiSuccessResponse<T> = { success: true, data };
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode | string,
  message: string,
  details?: Record<string, string[]>,
): Response {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message, details },
  };
  return res.status(statusCode).json(body);
}

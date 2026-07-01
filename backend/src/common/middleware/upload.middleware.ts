import multer, { type FileFilterCallback } from "multer";
import { type Request } from "express";
import { UnprocessableException } from "../exceptions/index.js";
import { ErrorCode } from "../constants/error-codes.enum.js";
import * as dotenv from "dotenv";

dotenv.config();

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES =
  Number(process.env.MAX_FILE_SIZE_BYTES) || 8 * 1024 * 1024; // 8 MB

/**
 * Uses memory storage — the uploaded buffer is available on req.file.buffer
 * and passed directly to Cloudinary. Nothing ever touches the filesystem,
 * which avoids disk-space issues and simplifies cleanup.
 */
const storage = multer.memoryStorage();

function fileFilter(
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
): void {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(
      new UnprocessableException(
        `Invalid file type "${file.mimetype}". Accepted types: JPEG, PNG, WebP.`,
        ErrorCode.INVALID_FILE_TYPE,
      ) as unknown as null,
      false,
    );
    return;
  }
  cb(null, true);
}

export const uploadSingleImage = (fieldName: string) =>
  multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
  }).single(fieldName);

/**
 * Wraps multer errors (file-too-large, unexpected field) into our standard
 * error envelope. Must be used as a middleware AFTER uploadSingleImage().
 */
export function handleMulterError(
  err: unknown,
  _req: Request,
  _res: unknown,
  next: (err: unknown) => void,
): void {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      next(
        new UnprocessableException(
          "File is too large. Maximum size is 8 MB.",
          ErrorCode.FILE_TOO_LARGE,
        ),
      );
      return;
    }
  }
  next(err);
}

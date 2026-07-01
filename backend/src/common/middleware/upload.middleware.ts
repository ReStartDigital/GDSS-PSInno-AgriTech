import multer, { type FileFilterCallback } from "multer";
import { type Request, type Response, type NextFunction } from "express";
import { UnprocessableException } from "../exceptions/index.js";
import { ErrorCode } from "../constants/error-codes.enum.js";

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
    // Pass a standard Error object with signature metadata attached
    const error = new Error(
      `Invalid file type "${file.mimetype}". Accepted types: JPEG, PNG, WebP.`,
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (error as any).code = ErrorCode.INVALID_FILE_TYPE;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cb(error as any, false);
    return;
  }
  cb(null, true);
}

const multerInstance = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

export const uploadSingleImage = (fieldName: string) =>
  multerInstance.single(fieldName);

/**
 * Intercepts Multer validation/file size bounds failures and maps them
 * safely into our application's unified custom exception boundary format.
 */
export function handleMulterError(
  err: unknown,
  _req: Request,
  _res: Response,
  next: NextFunction,
): void {
  if (!err) {
    return next();
  }

  // Handle standard Multer runtime constraint limits
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return next(
        new UnprocessableException(
          `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
          ErrorCode.FILE_TOO_LARGE,
        ),
      );
    }
  }

  // Handle our custom file filter type validation check
  if (
    err instanceof Error &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (err as any).code === ErrorCode.INVALID_FILE_TYPE
  ) {
    return next(
      new UnprocessableException(err.message, ErrorCode.INVALID_FILE_TYPE),
    );
  }

  next(err);
}

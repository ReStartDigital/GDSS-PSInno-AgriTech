import { v2 as cloudinary } from "cloudinary";
import { logError, logger } from "../../common/utils/logger.js";
import { AppException } from "../../common/exceptions/app.exceptions.js";
import { ErrorCode } from "../../common/constants/error-codes.enum.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
  secure: true,
});

export interface CloudinaryUploadResult {
  url: string;
  thumbnailUrl: string;
  publicId: string;
}

class CloudinaryClient {
  /**
   * Uploads a raw buffer to Cloudinary and returns both a full-resolution
   * WebP URL and a lightweight thumbnail URL.
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    publicId?: string,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const options = {
        folder,
        public_id: publicId ?? "",
        resource_type: "image" as const,
        format: "webp",
        transformation: [{ quality: "auto" }],
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error || !result) {
            logError("Cloudinary upload failed", error);
            return reject(
              new AppException(
                400,
                ErrorCode.PHOTO_UPLOAD_FAILED,
                error?.message ||
                  "Failed to push image asset to cloud storage tier.",
              ),
            );
          }

          // Thumbnail transformation via URL API — derived from the same asset
          const thumbnailUrl = cloudinary.url(result.public_id, {
            width: 300,
            crop: "fill",
            format: "webp",
            quality: "auto",
          });

          logger.debug("Cloudinary upload succeeded", {
            publicId: result.public_id,
          });

          resolve({
            url: result.secure_url,
            thumbnailUrl,
            publicId: result.public_id,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }

  async deleteAsset(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Keep this non-fatal as you designed — we don't want a dangling asset to break a DB transaction
      logError("Cloudinary delete failed", error, { publicId });
    }
  }
}

export const cloudinaryClient = new CloudinaryClient();

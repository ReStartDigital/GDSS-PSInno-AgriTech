import { v2 as cloudinary } from "cloudinary";
import { logError, logger } from "../../common/utils/logger.js";
import * as dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  api_key: process.env.CLOUDINARY_API_KEY ?? "",
  api_secret: process.env.CLOUDINARY_API_SECRET ?? "",
  secure: true,
});

export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  publicId?: string;
  errorReason?: string;
}

class CloudinaryClient {
  /**
   * Uploads a raw buffer to Cloudinary and returns both a full-resolution
   * URL and a thumbnail URL (300px wide, auto-format, auto-quality).
   * The thumbnail is served from the same asset — no duplicate storage.
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string,
    publicId?: string,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve) => {
      const options = {
        folder,
        public_id: publicId ?? "",
        resource_type: "image" as const,
        // Auto-convert to WebP for modern clients — reduces bandwidth
        // significantly for farmers on low-data mobile plans.
        format: "webp",
        transformation: [{ quality: "auto" }],
      };

      cloudinary.uploader
        .upload_stream(options, (error, result) => {
          if (error || !result) {
            logError("Cloudinary upload failed", error);
            resolve({
              success: false,
              errorReason: error?.message || "UPLOAD_FAILED",
            });
            return;
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
            success: true,
            url: result.secure_url,
            thumbnailUrl,
            publicId: result.public_id,
          });
        })
        .end(buffer);
    });
  }

  async deleteAsset(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      // Non-fatal — log and continue. A dangling Cloudinary asset is
      // not worth blocking the user's profile update.
      logError("Cloudinary delete failed", error, { publicId });
    }
  }
}

export const cloudinaryClient = new CloudinaryClient();

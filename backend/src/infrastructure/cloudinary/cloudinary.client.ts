import { v2 as cloudinary } from "cloudinary";

// Initialize using environment variables if available
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "mock_cloud",
  api_key: process.env.CLOUDINARY_API_KEY || "mock_key",
  api_secret: process.env.CLOUDINARY_API_SECRET || "mock_secret",
});

export const cloudinaryClient = {
  async uploadBuffer(
    fileBuffer: Buffer,
    folderPath: string,
    publicId?: string
  ): Promise<{ url: string; thumbnail_url: string; thumbnailUrl?: string; publicId: string }> {
    return new Promise((resolve, reject) => {
      // Graceful fallback for local development or preview environments when no API key is set
      const missingCredentials =
        !process.env.CLOUDINARY_CLOUD_NAME ||
        process.env.CLOUDINARY_CLOUD_NAME === "mock_cloud" ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET;

      if (missingCredentials) {
        // Return a mock placeholder URL so the app functions beautifully without credentials
        const fallbackUrl = folderPath.includes("profile")
          ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80"
          : "https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=600&q=80";

        return resolve({
          url: fallbackUrl,
          thumbnail_url: fallbackUrl,
          thumbnailUrl: fallbackUrl,
          publicId: publicId || "mock_id",
        });
      }

      const options: any = {
        folder: folderPath,
      };
      if (publicId) {
        options.public_id = publicId;
        options.overwrite = true;
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            return reject(error);
          }
          if (!result) {
            return reject(new Error("Upload result was empty"));
          }
          const thumb = result.eager?.[0]?.secure_url || result.secure_url;
          resolve({
            url: result.secure_url,
            thumbnail_url: thumb,
            thumbnailUrl: thumb,
            publicId: result.public_id,
          });
        }
      );

      uploadStream.end(fileBuffer);
    });
  },
};

import cloudinary from '@/config/cloudinary.js';
import { Readable } from 'stream';
import type { UploadApiErrorResponse, UploadApiResponse } from 'cloudinary';

// Upload buffer to Cloudinary
export const uploadToCloudinary = (
  buffer: Buffer,
  folder = 'logos',
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
        if (error) reject(error);
        else if (result) resolve(result);
        else reject(new Error('Cloudinary upload returned no result'));
      },
    );
    Readable.from(buffer).pipe(stream);
  });
};

// Delete image from Cloudinary
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete image: ${(error as Error).message}`);
  }
};

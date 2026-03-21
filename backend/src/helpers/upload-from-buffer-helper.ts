import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary';
import { UploadApiResponse } from 'cloudinary';

export const uploadFromBuffer = (
  fileBuffer: Buffer,
): Promise<{
  secure_url: string;
  public_id: string;
}> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        transformation: [
          { width: 256, height: 256, crop: 'fill' },
          { quality: 'auto' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as UploadApiResponse);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

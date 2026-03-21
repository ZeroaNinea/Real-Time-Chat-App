import streamifier from 'streamifier';
import cloudinary from '../config/cloudinary';

const uploadFromBuffer = (fileBuffer: Buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        transformation: [
          { width: 256, height: 256, crop: 'fill' },
          { quality: 'auto' },
        ],
      },
      (error: unknown, result: unknown) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

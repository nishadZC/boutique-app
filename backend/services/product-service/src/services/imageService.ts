import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required');
}

cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });

export const uploadProductImage = (buffer: Buffer, productId: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      { folder: 'boutique/products', public_id: productId, overwrite: true, resource_type: 'image' },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error('Cloudinary returned no upload result'));
          return;
        }
        resolve(result.secure_url);
      }
    );
    upload.end(buffer);
  });
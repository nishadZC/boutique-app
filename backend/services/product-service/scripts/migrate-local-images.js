const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { v2: cloudinary } = require('cloudinary');
require('dotenv').config({ path: path.resolve(__dirname, '../../../../.env') });

const required = (name) => {
  if (!process.env[name]) throw new Error(`${name} is required`);
  return process.env[name];
};

cloudinary.config({
  cloud_name: required('CLOUDINARY_CLOUD_NAME'),
  api_key: required('CLOUDINARY_API_KEY'),
  api_secret: required('CLOUDINARY_API_SECRET'),
  secure: true,
});

const pool = new Pool({ connectionString: required('DATABASE_URL') });
const imagesDirectory = path.resolve(__dirname, '../../../../frontend/public/product-images');
const imageByProduct = {
  'silk evening gown': 'silk-evening-gown.jpg',
  'cashmere coat': 'cashmere-coat.jpg',
  'leather handbag': 'leather-handbag.jpg',
  'diamond necklace': 'diamond-necklace.jpg',
  'designer heels': 'designer-heels.jpg',
  'gucci sunglasses': 'sunglasses.jpg',
  'prada loafers': 'leather-wallet.jpg',
  'louis vuitton keepall': 'trench-coat.jpg',
  'chanel no 5 perfume': 'cartier-bracelet.jpg',
};

const upload = (filePath, publicId) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: 'boutique/products', public_id: publicId, overwrite: true, resource_type: 'image' },
    (error, result) => error ? reject(error) : resolve(result.secure_url)
  );
  fs.createReadStream(filePath).pipe(stream);
});

const migrate = async () => {
  const { rows } = await pool.query('SELECT id, name FROM products');
  for (const product of rows) {
    const fileName = imageByProduct[product.name.toLowerCase()];
    if (!fileName) {
      console.warn(`Skipping ${product.name}: no local image mapping`);
      continue;
    }
    const filePath = path.join(imagesDirectory, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping ${product.name}: ${filePath} does not exist`);
      continue;
    }
    const imageUrl = await upload(filePath, product.id);
    const imageResult = await pool.query(
      'UPDATE product_images SET image_url = $1 WHERE product_id = $2 AND is_primary = true',
      [imageUrl, product.id]
    );
    if (imageResult.rowCount === 0) {
      await pool.query(
        'INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, true)',
        [product.id, imageUrl]
      );
    }
    fs.unlinkSync(filePath);
    console.log(`Migrated ${product.name}`);
  }
};

migrate().catch(error => {
  console.error('Image migration failed:', error);
  process.exitCode = 1;
}).finally(() => pool.end());
import express from 'express';
import { Pool } from 'pg';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'boutique_auth',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
});

// Helper function to map product to appropriate image
const getImageForProduct = (product) => {
  const productName = (product.name || '').toLowerCase();
  
  // Map specific products to production-ready images
  // You can place your AI-generated images in /public/product-images/ with these names:
  if (productName.includes('silk evening gown') || productName.includes('gown') || productName.includes('dress')) {
    return 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567122/boutique/products/923247c7-e534-453c-9c61-f9a9076de4c9.jpg';
  } else if (productName.includes('cashmere coat') || productName.includes('coat') || productName.includes('jacket')) {
    return 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567170/boutique/products/fb1dbafe-19ba-44a4-a342-d38c8ffe8f87.jpg';
  } else if (productName.includes('leather handbag') || productName.includes('handbag') || productName.includes('bag') || productName.includes('purse') || productName.includes('tote')) {
    return 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567171/boutique/products/ec1c8320-c5ef-42be-9bcb-62b411c02ced.jpg';
  } else if (productName.includes('diamond necklace') || productName.includes('necklace') || productName.includes('jewelry') || productName.includes('diamond')) {
    return 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567172/boutique/products/f1e52c6d-7c8f-43a6-96d6-c6b18c9c28e7.jpg';
  } else if (productName.includes('designer heels') || productName.includes('heels') || productName.includes('shoe') || productName.includes('boot') || productName.includes('sneaker')) {
    return 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567172/boutique/products/cbc8f48c-3c3c-442a-8935-05dd68f53318.jpg';
  }
  
  // Default fallback
  return 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585889/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg';
};

app.get('/products', async (req, res) => {
  try {
    // Query products with their primary images and category names
    const query = `
      SELECT 
        p.*,
        c.name as category,
        COALESCE(pi.image_url, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg') as image_url,
        COALESCE(pi.alt_text, p.name) as image_alt
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    
    // Format response to match expected structure
    const products = result.rows.map(product => {
      // Handle price that might be string or number from database
      let price = product.price;
      if (typeof price === 'string') {
        // Convert string to number, filtering out any non-numeric characters
        price = parseFloat(price.replace(/[^0-9.]/g, ''));
      }
      
      if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
        console.warn(`Invalid price for product ${product.id}: ${product.price}, using default 0`);
        price = 0;
      }
      
      return {
        ...product,
        // Convert numeric price to string for JSON consistency
        price: price.toString(),
        // Use proper local image mapping
        image_url: getImageForProduct(product)
      };
    });
    
    res.json({ 
      success: true, 
      data: {
        products: products,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          total: products.length,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get product with all its images and category name
    const productQuery = `
      SELECT 
        p.*,
        c.name as category,
        COALESCE(pi_primary.image_url, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585889/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg') as image_url,
        COALESCE(pi_primary.alt_text, p.name) as image_alt
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi_primary ON p.id = pi_primary.product_id AND pi_primary.is_primary = true
      WHERE p.id = $1
    `;
    const productResult = await pool.query(productQuery, [id]);
    
    if (productResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const productData = productResult.rows[0];
    
    // Handle price that might be string or number from database
    let price = productData.price;
    if (typeof price === 'string') {
      // Convert string to number, filtering out any non-numeric characters
      price = parseFloat(price.replace(/[^0-9.]/g, ''));
    }
    
    if (typeof price !== 'number' || isNaN(price) || !isFinite(price)) {
      console.warn(`Invalid price for product ${productData.id}: ${productData.price}, using default 0`);
      price = 0;
    }
    
    // Update main image URL
    productData.price = price.toString(); // Set the cleaned price back
    productData.image_url = getImageForProduct(productData);
    
    // Get all images for this product (for future use)
    const additionalImagesQuery = `
      SELECT image_url, alt_text, is_primary, sort_order
      FROM product_images
      WHERE product_id = $1
      ORDER BY sort_order ASC
    `;
    const additionalImagesResult = await pool.query(additionalImagesQuery, [id]);
    
    productData.images = additionalImagesResult.rows.map(img => ({
      url: getImageForProduct(productData), // Use same mapping for all images
      alt: img.alt_text,
      isPrimary: img.is_primary,
      sortOrder: img.sort_order
    }));
    
    // Convert validated price to string for consistency
    productData.price = price.toString();
    
    res.json({ success: true, data: productData });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ success: false, error: 'Failed to get product' });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Products service running on port ${PORT}`);
  console.log(`Connected to database: ${process.env.DB_NAME || 'boutique_auth'}`);
  console.log(`Images served from: /public/product-images/`);
});
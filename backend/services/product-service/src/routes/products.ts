import express from 'express';
import { query } from '../database/connection';
import { ServiceResponse } from '../types';
import { hasInternalToken } from '@boutique/shared';

const router = express.Router();

// ORDER BY cannot be parameterised, so only these whitelisted columns are allowed.
const SORT_COLUMNS: Record<string, string> = {
  created_at: 'p.created_at',
  updated_at: 'p.updated_at',
  name: 'p.name',
  price: 'p.price',
};
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const clampInt = (value: unknown, fallback: number, min: number, max: number) => {
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : fallback;
};

router.get('/', async (req, res) => {
  try {
    const {
      page = '1',
      limit = '12',
      sortBy = 'created_at',
      category,
      search,
      minPrice,
      maxPrice
    } = req.query;

    const pageNum = clampInt(page, 1, 1, 10000);
    const limitNum = clampInt(limit, 12, 1, 100);
    const offset = (pageNum - 1) * limitNum;
    const orderColumn = SORT_COLUMNS[String(sortBy)] ?? SORT_COLUMNS.created_at;
    const orderDirection = String(req.query.sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    let whereClause = 'WHERE p.is_active = true';
    const filterParams: any[] = [];
    let paramIndex = 1;

    if (category) {
      whereClause += ' AND c.name = $' + paramIndex;
      filterParams.push(category);
      paramIndex++;
    }

    if (search) {
      whereClause += ' AND (p.name ILIKE $' + paramIndex + ' OR p.description ILIKE $' + (paramIndex + 1) + ')';
      filterParams.push(`%${search}%`, `%${search}%`);
      paramIndex += 2;
    }

    // Handcrafted collection: /products?handcrafted=true
    if (String(req.query.handcrafted) === 'true') {
      whereClause += ' AND p.is_handcrafted = true';
    }

    if (minPrice) {
      whereClause += ' AND p.price >= $' + paramIndex;
      filterParams.push(minPrice);
      paramIndex++;
    }

    if (maxPrice) {
      whereClause += ' AND p.price <= $' + paramIndex;
      filterParams.push(maxPrice);
      paramIndex++;
    }

    const countQuery = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereClause}`;
    const productsQuery = `
      SELECT p.id, p.name, p.description, p.price, p.compare_price, 
             p.brand, p.inventory_quantity, p.is_featured, p.created_at, p.updated_at,
             p.is_handcrafted, p.made_to_measure, p.making_days,
             COALESCE(p.base_colour, '') as base_colour,
             COALESCE(p.skin_tone_tags, '{}') as skin_tone_tags,
             COALESCE(c.name, 'Uncategorized') as category,
             COALESCE(r.avg_rating, 0)::float AS rating, COALESCE(r.review_count, 0)::int AS review_count,
             COALESCE(NULLIF(pi.image_url, ''), 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg') as image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      LEFT JOIN (
        SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS review_count
        FROM product_reviews GROUP BY product_id
      ) r ON r.product_id = p.id
      ${whereClause}
      ORDER BY ${orderColumn} ${orderDirection}, p.id
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    const allParams = [...filterParams, limitNum, offset];
    
    const [countResult, productsResult] = await Promise.all([
      query(countQuery, filterParams),
      query(productsQuery, allParams)
    ]);

    const total = Number.parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limitNum);

    const response = {
      success: true,
      data: {
        products: productsResult.rows.map((product: any) => ({
          ...product,
          image_url: product.image_url || 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg'
        })),
        pagination: {
          currentPage: pageNum,
          totalPages,
          total,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    };

    res.json(response);
  } catch (error: any) {
    console.error('Get products error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products' });
  }
});

// GET /by-skin-tone/:group — filter products by skin tone group (e.g. 'deep', 'medium', 'fair', 'very_fair')
router.get('/by-skin-tone/:group', async (req, res) => {
  try {
    const { group } = req.params;
    const { limit = '18' } = req.query;
    const limitNum = clampInt(limit, 18, 1, 100);

    const result = await query(`
      SELECT p.id, p.name, p.description, p.price, p.compare_price,
             p.brand, p.inventory_quantity, p.is_featured,
             p.is_handcrafted, p.made_to_measure, p.making_days,
             COALESCE(p.base_colour, '') as base_colour,
             COALESCE(p.skin_tone_tags, '{}') as skin_tone_tags,
             COALESCE(c.name, 'Uncategorized') as category,
             COALESCE(r.avg_rating, 0)::float AS rating, COALESCE(r.review_count, 0)::int AS review_count,
             COALESCE(NULLIF(pi.image_url, ''), 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg') as image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      LEFT JOIN (
        SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS review_count
        FROM product_reviews GROUP BY product_id
      ) r ON r.product_id = p.id
      WHERE $1 = ANY(p.skin_tone_tags) AND p.is_active = true
      ORDER BY c.name, p.name
      LIMIT $2
    `, [group, limitNum]);

    const shirts = result.rows.filter((p: any) => p.category === 'Formal Shirts').slice(0, 6);
    const trousers = result.rows.filter((p: any) => p.category === 'Trousers & Pants').slice(0, 5);
    const shoes = result.rows.filter((p: any) => p.category === 'Formal Shoes').slice(0, 6);

    res.json({
      success: true,
      data: {
        group,
        all: result.rows,
        byCategory: { shirts, trousers, shoes }
      }
    });
  } catch (error: any) {
    console.error('Get by-skin-tone error:', error);
    res.status(500).json({ success: false, error: 'Failed to get products by skin tone' });
  }
});

// Must be registered before '/:id' or it is shadowed by it.
router.get('/categories', async (req, res) => {
  try {
    const result = await query(`
      SELECT c.*, COUNT(p.id) as product_count 
      FROM categories c 
      LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
      GROUP BY c.id, c.name, c.description, c.image_url
      ORDER BY c.name
    `);

    const response: ServiceResponse<any[]> = {
      success: true,
      data: result.rows
    };

    res.json(response);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to get categories' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!UUID_PATTERN.test(id)) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const result = await query(`
      SELECT p.id, p.name, p.description, p.price, p.compare_price, 
             p.brand, p.inventory_quantity, p.is_featured, p.is_active, p.created_at, p.updated_at,
             p.is_handcrafted, p.made_to_measure, p.making_days,
             COALESCE(p.base_colour, '') as base_colour,
             COALESCE(p.skin_tone_tags, '{}') as skin_tone_tags,
             COALESCE(c.name, 'Uncategorized') as category,
             COALESCE(r.avg_rating, 0)::float AS rating, COALESCE(r.review_count, 0)::int AS review_count,
             COALESCE(NULLIF(pi.image_url, ''), 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg') as image_url
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
      LEFT JOIN (
        SELECT product_id, ROUND(AVG(rating)::numeric, 1) AS avg_rating, COUNT(*) AS review_count
        FROM product_reviews GROUP BY product_id
      ) r ON r.product_id = p.id
      WHERE p.id = $1
    `, [id]);

    // Archived products are hidden from shoppers, but other services (order
    // history, order creation checks) still need to resolve them.
    if (result.rows.length === 0 || (!result.rows[0].is_active && !hasInternalToken(req))) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }

    const response = {
      success: true,
      data: {
        ...result.rows[0],
        image_url: result.rows[0].image_url || 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg'
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ success: false, error: 'Failed to get product' });
  }
});

export { router as productRoutes };

// Admin catalogue and inventory management, mounted at /admin (gateway:
// /api/products/admin/...). Every route requires an admin token.
import express from 'express';
import Joi from 'joi';
import multer from 'multer';
import { getPool, query } from '../database/connection';
import { requireAdmin } from '../middleware/auth';
import { uploadProductImage } from '../services/imageService';

const router = express.Router();
router.use(requireAdmin);

export const LOW_STOCK_THRESHOLD = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const ADJUSTMENT_REASONS = ['restock', 'correction', 'damaged', 'return', 'other'] as const;

const actorOf = (req: express.Request) => req.auth?.email ?? req.auth?.userId ?? 'admin';
const badRequest = (res: express.Response, error: Joi.ValidationError) =>
  res.status(400).json({ success: false, error: error.details.map(d => d.message.replace(/"/g, '')).join('; ') });

const productFields = {
  name: Joi.string().trim().min(2).max(255),
  description: Joi.string().trim().max(5000).allow(''),
  shortDescription: Joi.string().trim().max(500).allow(''),
  sku: Joi.string().trim().max(100).allow(''),
  brand: Joi.string().trim().max(100).allow(''),
  categoryId: Joi.string().pattern(UUID_PATTERN),
  price: Joi.number().positive().precision(2).max(10_000_000),
  comparePrice: Joi.number().positive().precision(2).max(10_000_000).allow(null),
  materials: Joi.string().trim().max(1000).allow(''),
  careInstructions: Joi.string().trim().max(1000).allow(''),
  isFeatured: Joi.boolean(),
  isHandcrafted: Joi.boolean(),
  madeToMeasure: Joi.boolean(),
  // Working days to tailor a made-to-measure order; null when not offered.
  makingDays: Joi.number().integer().min(1).max(120).allow(null),
  baseColour: Joi.string().trim().max(100).allow(''),
  skinToneTags: Joi.array().items(Joi.string().pattern(/^[a-z_]{2,20}$/)).max(6).unique(),
  imageUrl: Joi.string().uri({ scheme: ['https'] }).max(500),
};

export const createProductSchema = Joi.object({
  ...productFields,
  name: productFields.name.required(),
  categoryId: productFields.categoryId.required(),
  price: productFields.price.required(),
  inventoryQuantity: Joi.number().integer().min(0).max(100_000).default(0),
}).custom((value, helpers) => {
  if (value.comparePrice != null && value.comparePrice <= value.price) {
    return helpers.message({ custom: 'comparePrice must be greater than price' });
  }
  if (value.madeToMeasure && value.makingDays == null) {
    return helpers.message({ custom: 'makingDays is required for made-to-measure products' });
  }
  return value;
});

export const updateProductSchema = Joi.object(productFields).min(1);

export const inventorySchema = Joi.object({
  mode: Joi.string().valid('set', 'adjust').required(),
  quantity: Joi.number().integer().min(-100_000).max(100_000).required(),
  reason: Joi.string().valid(...ADJUSTMENT_REASONS).required(),
  note: Joi.string().trim().max(500).allow(''),
});

const ADMIN_PRODUCT_SELECT = `
  SELECT p.id, p.name, p.slug, p.sku, p.brand, p.description, p.short_description, p.price, p.compare_price,
         p.materials, p.care_instructions, p.inventory_quantity, p.is_featured, p.is_active,
         p.is_handcrafted, p.made_to_measure, p.making_days,
         COALESCE(p.base_colour, '') AS base_colour, COALESCE(p.skin_tone_tags, '{}') AS skin_tone_tags,
         p.category_id, COALESCE(c.name, 'Uncategorized') AS category, pi.image_url, p.created_at, p.updated_at
  FROM products p
  LEFT JOIN categories c ON p.category_id = c.id
  LEFT JOIN product_images pi ON pi.product_id = p.id AND pi.is_primary = true`;

const toAdminProduct = (row: any) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  sku: row.sku ?? '',
  brand: row.brand ?? '',
  description: row.description ?? '',
  shortDescription: row.short_description ?? '',
  price: Number(row.price),
  comparePrice: row.compare_price == null ? null : Number(row.compare_price),
  materials: row.materials ?? '',
  careInstructions: row.care_instructions ?? '',
  inventoryQuantity: row.inventory_quantity ?? 0,
  isFeatured: !!row.is_featured,
  isActive: !!row.is_active,
  isHandcrafted: !!row.is_handcrafted,
  madeToMeasure: !!row.made_to_measure,
  makingDays: row.making_days ?? null,
  baseColour: row.base_colour ?? '',
  skinToneTags: row.skin_tone_tags ?? [],
  categoryId: row.category_id,
  category: row.category,
  imageUrl: row.image_url ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const slugify = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 200);

async function categoryExists(id: string) {
  const result = await query('SELECT 1 FROM categories WHERE id = $1', [id]);
  return result.rows.length > 0;
}

async function skuTaken(sku: string, exceptId?: string) {
  if (!sku) return false;
  const result = await query(
    'SELECT 1 FROM products WHERE LOWER(sku) = LOWER($1) AND ($2::uuid IS NULL OR id <> $2::uuid)',
    [sku, exceptId ?? null],
  );
  return result.rows.length > 0;
}

// ---------------------------------------------------------------------------
// Catalogue
// ---------------------------------------------------------------------------

router.get('/categories', async (_req, res) => {
  try {
    const result = await query(`
      SELECT c.id, c.name, COUNT(p.id) FILTER (WHERE p.is_active) AS product_count
      FROM categories c LEFT JOIN products p ON p.category_id = c.id
      GROUP BY c.id, c.name ORDER BY c.name`);
    res.json({ success: true, data: result.rows.map((r: any) => ({ id: r.id, name: r.name, productCount: Number(r.product_count) })) });
  } catch (error) {
    console.error('Admin categories error:', error);
    res.status(500).json({ success: false, error: 'Failed to load categories' });
  }
});

router.get('/products', async (req, res) => {
  const page = Math.max(Number.parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(String(req.query.limit ?? '25'), 10) || 25, 1), 100);
  const conditions: string[] = [];
  const params: any[] = [];
  const add = (sql: string, value: unknown) => { params.push(value); conditions.push(sql.replace('?', `$${params.length}`)); };

  const status = String(req.query.status ?? 'all');
  if (status === 'active') conditions.push('p.is_active = true');
  if (status === 'archived') conditions.push('p.is_active = false');
  const stock = String(req.query.stock ?? '');
  if (stock === 'out') conditions.push('p.inventory_quantity = 0');
  if (stock === 'low') add('p.inventory_quantity BETWEEN 1 AND ?', LOW_STOCK_THRESHOLD);
  if (req.query.categoryId && UUID_PATTERN.test(String(req.query.categoryId))) add('p.category_id = ?', req.query.categoryId);
  if (req.query.search) {
    params.push(`%${String(req.query.search).trim().slice(0, 100)}%`);
    const n = params.length;
    conditions.push(`(p.name ILIKE $${n} OR p.sku ILIKE $${n} OR p.brand ILIKE $${n})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const [rows, count] = await Promise.all([
      query(`${ADMIN_PRODUCT_SELECT} ${where} ORDER BY p.updated_at DESC, p.id LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, (page - 1) * limit]),
      query(`SELECT COUNT(*) AS total FROM products p ${where}`, params),
    ]);
    const total = Number(count.rows[0].total);
    res.json({ success: true, data: { products: rows.rows.map(toAdminProduct), pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (error) {
    console.error('Admin list products error:', error);
    res.status(500).json({ success: false, error: 'Failed to load products' });
  }
});

router.get('/products/:id', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(404).json({ success: false, error: 'Product not found' });
  try {
    const result = await query(`${ADMIN_PRODUCT_SELECT} WHERE p.id = $1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, error: 'Product not found' });
    return res.json({ success: true, data: toAdminProduct(result.rows[0]) });
  } catch (error) {
    console.error('Admin get product error:', error);
    return res.status(500).json({ success: false, error: 'Failed to load product' });
  }
});

router.post('/products', async (req, res) => {
  const { value, error } = createProductSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return badRequest(res, error);

  if (!(await categoryExists(value.categoryId))) return res.status(400).json({ success: false, error: 'Unknown category' });
  if (await skuTaken(value.sku)) return res.status(409).json({ success: false, error: 'A product with this SKU already exists' });

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const inserted = await client.query(`
      INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price,
                            materials, care_instructions, inventory_quantity, is_featured, base_colour, skin_tone_tags, is_active,
                            is_handcrafted, made_to_measure, making_days)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, true, $16, $17, $18)
      RETURNING id`,
      [value.name, `${slugify(value.name)}-${Date.now().toString(36)}`, value.description ?? '', value.shortDescription ?? '',
        value.sku || null, value.brand ?? '', value.categoryId, value.price, value.comparePrice ?? null,
        value.materials ?? '', value.careInstructions ?? '', value.inventoryQuantity, value.isFeatured ?? false,
        value.baseColour ?? '', value.skinToneTags ?? [],
        value.isHandcrafted ?? false, value.madeToMeasure ?? false, value.makingDays ?? null]);
    const id = inserted.rows[0].id;
    if (value.imageUrl) {
      await client.query('INSERT INTO product_images (product_id, image_url, alt_text, is_primary) VALUES ($1, $2, $3, true)', [id, value.imageUrl, value.name]);
    }
    if (value.inventoryQuantity > 0) {
      await client.query(
        `INSERT INTO inventory_adjustments (product_id, delta, resulting_quantity, reason, note, actor)
         VALUES ($1, $2, $2, 'restock', 'Initial stock', $3)`, [id, value.inventoryQuantity, actorOf(req)]);
    }
    await client.query('COMMIT');
    const created = await query(`${ADMIN_PRODUCT_SELECT} WHERE p.id = $1`, [id]);
    return res.status(201).json({ success: true, data: toAdminProduct(created.rows[0]) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Admin create product error:', err);
    return res.status(500).json({ success: false, error: 'Failed to create product' });
  } finally {
    client.release();
  }
});

const UPDATE_COLUMNS: Record<string, string> = {
  name: 'name', description: 'description', shortDescription: 'short_description', sku: 'sku', brand: 'brand',
  categoryId: 'category_id', price: 'price', comparePrice: 'compare_price', materials: 'materials',
  careInstructions: 'care_instructions', isFeatured: 'is_featured', baseColour: 'base_colour', skinToneTags: 'skin_tone_tags',
  isHandcrafted: 'is_handcrafted', madeToMeasure: 'made_to_measure', makingDays: 'making_days',
};

router.put('/products/:id', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(404).json({ success: false, error: 'Product not found' });
  const { value, error } = updateProductSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return badRequest(res, error);

  try {
    const current = await query('SELECT price, compare_price, made_to_measure, making_days FROM products WHERE id = $1', [req.params.id]);
    if (current.rows.length === 0) return res.status(404).json({ success: false, error: 'Product not found' });
    const price = value.price ?? Number(current.rows[0].price);
    const comparePrice = value.comparePrice !== undefined ? value.comparePrice : current.rows[0].compare_price;
    if (comparePrice != null && Number(comparePrice) <= price) {
      return res.status(400).json({ success: false, error: 'comparePrice must be greater than price' });
    }
    const madeToMeasure = value.madeToMeasure ?? current.rows[0].made_to_measure;
    const makingDays = value.makingDays !== undefined ? value.makingDays : current.rows[0].making_days;
    if (madeToMeasure && makingDays == null) {
      return res.status(400).json({ success: false, error: 'makingDays is required for made-to-measure products' });
    }
    if (value.categoryId && !(await categoryExists(value.categoryId))) return res.status(400).json({ success: false, error: 'Unknown category' });
    if (value.sku && await skuTaken(value.sku, req.params.id)) return res.status(409).json({ success: false, error: 'A product with this SKU already exists' });

    const sets: string[] = [];
    const params: any[] = [];
    for (const [key, column] of Object.entries(UPDATE_COLUMNS)) {
      if (value[key] === undefined) continue;
      params.push(key === 'sku' ? (value.sku || null) : value[key]);
      sets.push(`${column} = $${params.length}`);
    }
    if (sets.length) {
      params.push(req.params.id);
      await query(`UPDATE products SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${params.length}`, params);
    }
    if (value.imageUrl) {
      const updated = await query('UPDATE product_images SET image_url = $1 WHERE product_id = $2 AND is_primary = true', [value.imageUrl, req.params.id]);
      if (updated.rowCount === 0) {
        await query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, true)', [req.params.id, value.imageUrl]);
      }
    }
    const result = await query(`${ADMIN_PRODUCT_SELECT} WHERE p.id = $1`, [req.params.id]);
    return res.json({ success: true, data: toAdminProduct(result.rows[0]) });
  } catch (err) {
    console.error('Admin update product error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// Archive / restore. Products are never hard-deleted: past orders reference them.
router.patch('/products/:id/status', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(404).json({ success: false, error: 'Product not found' });
  if (typeof req.body?.isActive !== 'boolean') return res.status(400).json({ success: false, error: 'isActive must be true or false' });
  try {
    const result = await query('UPDATE products SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id', [req.body.isActive, req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ success: false, error: 'Product not found' });
    const product = await query(`${ADMIN_PRODUCT_SELECT} WHERE p.id = $1`, [req.params.id]);
    return res.json({ success: true, data: toAdminProduct(product.rows[0]) });
  } catch (err) {
    console.error('Admin product status error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update product status' });
  }
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

router.post('/products/:id/image', (req, res, next) => {
  upload.single('image')(req, res, err => {
    if (err) return res.status(400).json({ success: false, error: err.code === 'LIMIT_FILE_SIZE' ? 'Image must be 5 MB or smaller' : 'Invalid image upload' });
    return next();
  });
}, async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(404).json({ success: false, error: 'Product not found' });
  if (!req.file) return res.status(400).json({ success: false, error: 'A JPEG, PNG or WebP image is required' });
  try {
    const exists = await query('SELECT 1 FROM products WHERE id = $1', [req.params.id]);
    if (exists.rows.length === 0) return res.status(404).json({ success: false, error: 'Product not found' });
    const imageUrl = await uploadProductImage(req.file.buffer, req.params.id);
    const updated = await query('UPDATE product_images SET image_url = $1 WHERE product_id = $2 AND is_primary = true', [imageUrl, req.params.id]);
    if (updated.rowCount === 0) {
      await query('INSERT INTO product_images (product_id, image_url, is_primary) VALUES ($1, $2, true)', [req.params.id, imageUrl]);
    }
    await query('UPDATE products SET updated_at = CURRENT_TIMESTAMP WHERE id = $1', [req.params.id]);
    return res.status(201).json({ success: true, data: { imageUrl } });
  } catch (err) {
    console.error('Admin image upload error:', err);
    return res.status(502).json({ success: false, error: 'Failed to upload product image' });
  }
});

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

router.post('/products/:id/inventory', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(404).json({ success: false, error: 'Product not found' });
  const { value, error } = inventorySchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return badRequest(res, error);
  if (value.mode === 'set' && value.quantity < 0) return res.status(400).json({ success: false, error: 'Stock cannot be negative' });

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query('SELECT inventory_quantity FROM products WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (locked.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    const before = Number(locked.rows[0].inventory_quantity ?? 0);
    const after = value.mode === 'set' ? value.quantity : before + value.quantity;
    if (after < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: `Only ${before} in stock; cannot remove ${-value.quantity}` });
    }
    if (after === before) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, error: 'Stock is already at that level' });
    }
    await client.query('UPDATE products SET inventory_quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [after, req.params.id]);
    await client.query(
      `INSERT INTO inventory_adjustments (product_id, delta, resulting_quantity, reason, note, actor)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.params.id, after - before, after, value.reason, value.note ?? '', actorOf(req)]);
    await client.query('COMMIT');
    return res.json({ success: true, data: { productId: req.params.id, previousQuantity: before, inventoryQuantity: after } });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Admin inventory adjust error:', err);
    return res.status(500).json({ success: false, error: 'Failed to update stock' });
  } finally {
    client.release();
  }
});

router.get('/products/:id/inventory-history', async (req, res) => {
  if (!UUID_PATTERN.test(req.params.id)) return res.status(404).json({ success: false, error: 'Product not found' });
  try {
    const result = await query(
      `SELECT id, delta, resulting_quantity, reason, note, actor, order_id, created_at
       FROM inventory_adjustments WHERE product_id = $1 ORDER BY created_at DESC LIMIT 50`, [req.params.id]);
    res.json({
      success: true,
      data: result.rows.map((r: any) => ({
        id: r.id, delta: r.delta, resultingQuantity: r.resulting_quantity, reason: r.reason,
        note: r.note ?? '', actor: r.actor ?? '', orderId: r.order_id, createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('Admin inventory history error:', err);
    res.status(500).json({ success: false, error: 'Failed to load stock history' });
  }
});

router.get('/inventory/summary', async (_req, res) => {
  try {
    const [totals, low] = await Promise.all([
      query(`
        SELECT COUNT(*) FILTER (WHERE is_active) AS active,
               COUNT(*) FILTER (WHERE NOT is_active) AS archived,
               COUNT(*) FILTER (WHERE is_active AND inventory_quantity = 0) AS out_of_stock,
               COUNT(*) FILTER (WHERE is_active AND inventory_quantity BETWEEN 1 AND $1) AS low_stock,
               COALESCE(SUM(inventory_quantity) FILTER (WHERE is_active), 0) AS units,
               COALESCE(SUM(inventory_quantity * price) FILTER (WHERE is_active), 0) AS retail_value
        FROM products`, [LOW_STOCK_THRESHOLD]),
      query(`${ADMIN_PRODUCT_SELECT} WHERE p.is_active AND p.inventory_quantity <= $1 ORDER BY p.inventory_quantity, p.name LIMIT 10`, [LOW_STOCK_THRESHOLD]),
    ]);
    const t = totals.rows[0];
    res.json({
      success: true,
      data: {
        activeProducts: Number(t.active), archivedProducts: Number(t.archived), outOfStock: Number(t.out_of_stock),
        lowStock: Number(t.low_stock), unitsInStock: Number(t.units), retailValue: Number(t.retail_value),
        lowStockThreshold: LOW_STOCK_THRESHOLD, lowStockProducts: low.rows.map(toAdminProduct),
      },
    });
  } catch (err) {
    console.error('Admin inventory summary error:', err);
    res.status(500).json({ success: false, error: 'Failed to load inventory summary' });
  }
});

export { router as adminRoutes };

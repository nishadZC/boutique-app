/**
 * POST /recommendations
 *
 * Full pipeline per the implementation plan:
 *  1. Accept multipart image from React
 *  2. Forward to FastAPI /detect-skin-tone
 *  3. Query PostgreSQL for matching formal products by recommended colors
 *  4. Generate outfit combinations (topwear + pants + shoes)
 *  5. Return complete response to React
 */

import express from 'express';
import multer from 'multer';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { query } from '../database/connection';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

const FASTAPI_URL = process.env.SKIN_TONE_SERVICE_URL || 'http://localhost:5001';

// ── Helper: call FastAPI skin-tone service ────────────────────
async function detectSkinTone(imageBuffer: Buffer, mimetype: string, originalname: string) {
  const form = new FormData();
  form.append('image', imageBuffer, {
    filename: originalname || 'upload.jpg',
    contentType: mimetype,
  });

  const response = await fetch(`${FASTAPI_URL}/detect-skin-tone`, {
    method: 'POST',
    body: form,
    headers: form.getHeaders(),
  });

  if (!response.ok) {
    const err: any = await response.json().catch(() => ({}));
    throw new Error(err.detail || `Skin tone service returned ${response.status}`);
  }

  return response.json() as Promise<{
    skinTone: { hex: string; name: string; group: string; confidence: number; face_detected: boolean };
    recommendedColors: string[];
    shirtColors: string[];
    pantColors: string[];
    shoeColors: string[];
  }>;
}

// ── Helper: query products by category + colors ───────────────
async function getProductsByColors(categoryName: string, colors: string[], limit = 6) {
  if (!colors.length) return [];

  const colorParams = colors.map((_, i) => `$${i + 2}`).join(', ');
  const result = await query(
    `SELECT p.id, p.name, p.price, p.compare_price, p.brand,
            COALESCE(p.base_colour, '') as color,
            COALESCE(c.name, '') as category,
            COALESCE(NULLIF(pi.image_url, ''), '') as image_url
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.is_primary = true
     WHERE c.name = $1
       AND LOWER(p.base_colour) = ANY(
             SELECT LOWER(v) FROM unnest(ARRAY[${colorParams}]::text[]) v
           )
       AND p.inventory_quantity > 0
     ORDER BY RANDOM()
     LIMIT ${limit}`,
    [categoryName, ...colors]
  );
  return result.rows;
}

// ── Helper: build outfit combinations ────────────────────────
function buildOutfits(shirts: any[], trousers: any[], shoes: any[], count = 5) {
  const outfits: any[] = [];
  for (const shirt of shirts) {
    for (const trouser of trousers) {
      for (const shoe of shoes) {
        outfits.push({
          topwear: { id: shirt.id, name: shirt.name, color: shirt.color, image_url: shirt.image_url, price: shirt.price },
          pants:   { id: trouser.id, name: trouser.name, color: trouser.color, image_url: trouser.image_url, price: trouser.price },
          shoes:   { id: shoe.id, name: shoe.name, color: shoe.color, image_url: shoe.image_url, price: shoe.price },
        });
        if (outfits.length >= count) return outfits;
      }
    }
  }
  return outfits;
}

// ── POST /recommendations ─────────────────────────────────────
router.post('/', upload.single('image'), async (req, res) => {
  try {
    // 1. Validate image
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image provided. Please upload a face photo.' });
    }

    // 2. Call FastAPI → get skin tone + recommended colors
    let fastApiResult: Awaited<ReturnType<typeof detectSkinTone>>;
    try {
      fastApiResult = await detectSkinTone(req.file.buffer, req.file.mimetype, req.file.originalname);
    } catch (err: any) {
      if (err.message?.includes('No face detected')) {
        return res.status(422).json({ success: false, error: err.message });
      }
      return res.status(503).json({ success: false, error: 'Skin tone service is unavailable. Please try again later.' });
    }

    const { skinTone, shirtColors, pantColors, shoeColors, recommendedColors } = fastApiResult;

    // 3. Query PostgreSQL for matching products
    const [shirts, trousers, shoes] = await Promise.all([
      getProductsByColors('Formal Shirts',     shirtColors,  6),
      getProductsByColors('Trousers & Pants', pantColors,   5),
      getProductsByColors('Formal Shoes',     shoeColors,   6),
    ]);

    // 4. If no products match by color, fall back to any formal products
    const [fallbackShirts, fallbackTrousers, fallbackShoes] = await Promise.all([
      shirts.length   ? [] : getProductsByColors('Formal Shirts',    ['White', 'Navy Blue', 'Black', 'Light Blue', 'Grey'], 4),
      trousers.length ? [] : getProductsByColors('Trousers & Pants', ['Black', 'Navy Blue', 'Grey', 'Charcoal'], 4),
      shoes.length    ? [] : getProductsByColors('Formal Shoes',     ['Black', 'Brown', 'Tan', 'Burgundy'], 4),
    ]);

    const finalShirts   = shirts.length   ? shirts   : fallbackShirts;
    const finalTrousers = trousers.length ? trousers : fallbackTrousers;
    const finalShoes    = shoes.length    ? shoes    : fallbackShoes;

    // 5. Build outfit combinations
    const outfits = buildOutfits(finalShirts, finalTrousers, finalShoes, 5);

    // 6. Return complete response
    return res.json({
      success: true,
      skinTone: {
        name: skinTone.name,
        hex:  skinTone.hex,
        confidence: skinTone.confidence,
        faceDetected: skinTone.face_detected,
      },
      recommendedColors,
      recommendations: {
        topwear:  finalShirts,
        pants:    finalTrousers,
        shoes:    finalShoes,
      },
      outfits,
    });

  } catch (error: any) {
    console.error('Recommendations error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error', details: error.message });
  }
});

export { router as recommendationRoutes };

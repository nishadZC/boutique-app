#!/usr/bin/env python3
"""
Generate seed_formal_products.sql from uploaded_images.json
"""
import json

with open('/home/vboxuser/projects/boutique-app/uploaded_images.json') as f:
    images = json.load(f)

# Skin tone tags per color (which skin tones are complemented by this color)
COLOR_SKIN_TAGS = {
    "White":     ["deep", "medium_dark", "medium", "fair", "very_fair"],
    "Light Blue":["medium", "fair", "very_fair"],
    "Navy Blue": ["deep", "medium_dark", "medium", "fair", "very_fair"],
    "Blue":      ["medium_dark", "medium", "fair", "very_fair"],
    "Charcoal":  ["deep", "medium_dark", "fair", "very_fair"],
    "Cream":     ["deep", "medium_dark", "medium"],
    "Lavender":  ["medium", "fair"],
    "Burgundy":  ["deep", "medium_dark", "medium", "fair", "very_fair"],
    "Olive":     ["deep", "medium_dark", "medium"],
    "Pink":      ["medium", "fair"],
    "Peach":     ["deep", "medium_dark", "medium"],
    "Teal":      ["deep", "medium_dark", "medium"],
    "Mustard":   ["deep", "medium_dark", "medium"],
    "Coral":     ["medium", "fair"],
    "Sea Green": ["medium_dark", "medium", "fair"],
    "Grey":      ["deep", "medium_dark", "fair", "very_fair"],
    "Black":     ["deep", "medium_dark", "fair", "very_fair"],
    "Brown":     ["deep", "medium_dark", "medium"],
    "Khaki":     ["medium_dark", "medium"],
    "Beige":     ["medium_dark", "medium"],
    "Tan":       ["deep", "medium_dark", "medium"],
}

# Price ranges per category (mid-range)
PRICES = {
    "shirts": [1299, 1499, 1699, 1899, 2199, 2499, 2799, 1999, 2299, 1599, 2099, 1749, 2399, 1349, 1849, 2649, 1449],
    "trousers": [1899, 2199, 2499, 2799, 2099, 1799, 2399, 2299, 2599, 1999, 2699],
    "shoes": [2999, 3499, 3999, 4499, 2799, 3299, 3799, 4299, 2599, 3099, 3599, 4099, 2699, 3199, 3699, 4199, 2899, 3399, 3899, 4399, 2499],
}

CATEGORY_IDS = {
    "shirts": "20000000-0000-0000-0000-000000000001",
    "trousers": "20000000-0000-0000-0000-000000000002",
    "shoes": "20000000-0000-0000-0000-000000000003",
}

SKUS = {
    "shirts": "FSHIRT",
    "trousers": "FTROUSER",
    "shoes": "FSHOE",
}

shirts = [(k, v) for k, v in images.items() if v["category"] == "shirts"]
trousers = [(k, v) for k, v in images.items() if v["category"] == "trousers"]
shoes = [(k, v) for k, v in images.items() if v["category"] == "shoes"]

sql_lines = []

sql_lines.append("""-- ============================================================
-- Men's Formal Wear Product Seed
-- Generated from Kaggle images uploaded to Cloudinary
-- ============================================================

-- Step 1: Remove all old products
DELETE FROM product_images;
DELETE FROM products;
DELETE FROM categories WHERE id IN (
  '10000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000005'
);

-- Step 2: Insert new formal menswear categories
INSERT INTO categories (id, name, description, created_at, updated_at) VALUES
('20000000-0000-0000-0000-000000000001', 'Formal Shirts', 'Premium formal dress shirts and business shirts for men', NOW(), NOW()),
('20000000-0000-0000-0000-000000000002', 'Trousers & Pants', 'Tailored formal trousers and suit pants for men', NOW(), NOW()),
('20000000-0000-0000-0000-000000000003', 'Formal Shoes', 'Oxford, Derby, loafer and formal leather shoes for men', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 3: Add skin_tone_tags column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS skin_tone_tags TEXT[] DEFAULT '{}';
ALTER TABLE products ADD COLUMN IF NOT EXISTS base_colour VARCHAR(100) DEFAULT '';

-- Step 4: Insert formal products
INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price, materials, care_instructions, inventory_quantity, is_featured, skin_tone_tags, base_colour) VALUES
""")

product_rows = []
image_rows = []
all_products = [
    ("shirts", shirts, PRICES["shirts"]),
    ("trousers", trousers, PRICES["trousers"]),
    ("shoes", shoes, PRICES["shoes"]),
]

counter = {"shirts": 1, "trousers": 1, "shoes": 1}

for category, items, prices in all_products:
    cat_id = CATEGORY_IDS[category]
    sku_prefix = SKUS[category]
    price_list = prices
    
    for idx, (img_id, meta) in enumerate(items):
        price = price_list[idx % len(price_list)]
        compare_price = int(price * 1.2)
        sku = f"{sku_prefix}-{img_id}"
        name = meta["name"]
        brand = meta["brand"]
        color = meta["color"]
        num = counter[category]
        counter[category] += 1
        
        slug = name.lower().replace(' ', '-').replace("'", "").replace(",", "")
        
        # Build skin tone tags
        tags = COLOR_SKIN_TAGS.get(color, ["medium"])
        tags_str = "{" + ",".join(tags) + "}"
        
        # Materials based on category
        if category == "shirts":
            materials = "100% Premium Cotton"
        elif category == "trousers":
            materials = "Poly-Viscose Blend, Partially Lined"
        else:
            materials = "Genuine Leather Upper, Rubber Sole"
        
        # Care instructions
        if category in ["shirts", "trousers"]:
            care = "Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat"
        else:
            care = "Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag"
        
        desc = f"{name} — a premium men's formal {category.rstrip('s')} in {color}. Perfect for business meetings, formal events, and office wear. Crafted by {brand} with attention to detail and comfort."
        short_desc = f"Premium {color} men's formal {category.rstrip('s')} by {brand}"
        
        qty = 20 + (num * 3) % 30
        featured = "true" if num <= 4 else "false"
        
        product_rows.append(
            f"('{name}', '{slug}-{img_id}', '{desc}', '{short_desc}', '{sku}', '{brand}', '{cat_id}', {price}.00, {compare_price}.00, '{materials}', '{care}', {qty}, {featured}, '{tags_str}', '{color}')"
        )
        
        # Image row will be inserted separately
        image_rows.append((sku, meta["cloudinary_url"], name))

sql_lines.append(",\n".join(product_rows))
sql_lines.append(";")
sql_lines.append("")
sql_lines.append("-- Step 5: Insert product images")

for sku, url, name in image_rows:
    sql_lines.append(f"""INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, '{url}', '{name} - Main Image', true, 1
FROM products p WHERE p.sku = '{sku}';""")

full_sql = "\n".join(sql_lines)

with open('/home/vboxuser/projects/boutique-app/database/seed_formal_products.sql', 'w') as f:
    f.write(full_sql)

print(f"Generated seed SQL with {len(product_rows)} products and {len(image_rows)} images")
print(f"Shirts: {len(shirts)}, Trousers: {len(trousers)}, Shoes: {len(shoes)}")

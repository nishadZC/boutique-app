-- ============================================================
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

('White Formal Dress Shirt', 'white-formal-dress-shirt-10260', 'White Formal Dress Shirt — a premium men's formal shirt in White. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium White men's formal shirt by Arrow', 'FSHIRT-10260', 'Arrow', '20000000-0000-0000-0000-000000000001', 1299.00, 1558.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 23, true, '{deep,medium_dark,medium,fair,very_fair}', 'White'),
('Light Blue Oxford Shirt', 'light-blue-oxford-shirt-11110', 'Light Blue Oxford Shirt — a premium men's formal shirt in Light Blue. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Light Blue men's formal shirt by Van Heusen', 'FSHIRT-11110', 'Van Heusen', '20000000-0000-0000-0000-000000000001', 1499.00, 1798.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 26, true, '{medium,fair,very_fair}', 'Light Blue'),
('Navy Blue Formal Shirt', 'navy-blue-formal-shirt-11162', 'Navy Blue Formal Shirt — a premium men's formal shirt in Navy Blue. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Navy Blue men's formal shirt by Peter England', 'FSHIRT-11162', 'Peter England', '20000000-0000-0000-0000-000000000001', 1699.00, 2038.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 29, true, '{deep,medium_dark,medium,fair,very_fair}', 'Navy Blue'),
('Slim Fit White Shirt', 'slim-fit-white-shirt-12220', 'Slim Fit White Shirt — a premium men's formal shirt in White. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium White men's formal shirt by Arrow', 'FSHIRT-12220', 'Arrow', '20000000-0000-0000-0000-000000000001', 1899.00, 2278.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 32, true, '{deep,medium_dark,medium,fair,very_fair}', 'White'),
('Blue Striped Formal Shirt', 'blue-striped-formal-shirt-12255', 'Blue Striped Formal Shirt — a premium men's formal shirt in Blue. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Blue men's formal shirt by Raymond', 'FSHIRT-12255', 'Raymond', '20000000-0000-0000-0000-000000000001', 2199.00, 2638.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 35, false, '{medium_dark,medium,fair,very_fair}', 'Blue'),
('Charcoal Grey Formal Shirt', 'charcoal-grey-formal-shirt-12274', 'Charcoal Grey Formal Shirt — a premium men's formal shirt in Grey. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Grey men's formal shirt by Van Heusen', 'FSHIRT-12274', 'Van Heusen', '20000000-0000-0000-0000-000000000001', 2499.00, 2998.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 38, false, '{deep,medium_dark,fair,very_fair}', 'Grey'),
('Cream Formal Dress Shirt', 'cream-formal-dress-shirt-12289', 'Cream Formal Dress Shirt — a premium men's formal shirt in Cream. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Cream men's formal shirt by Peter England', 'FSHIRT-12289', 'Peter England', '20000000-0000-0000-0000-000000000001', 2799.00, 3358.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 41, false, '{deep,medium_dark,medium}', 'Cream'),
('Black Formal Business Shirt', 'black-formal-business-shirt-12297', 'Black Formal Business Shirt — a premium men's formal shirt in Black. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium Black men's formal shirt by Arrow', 'FSHIRT-12297', 'Arrow', '20000000-0000-0000-0000-000000000001', 1999.00, 2398.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 44, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Lavender Formal Shirt', 'lavender-formal-shirt-13661', 'Lavender Formal Shirt — a premium men's formal shirt in Lavender. Perfect for business meetings, formal events, and office wear. Crafted by Park Avenue with attention to detail and comfort.', 'Premium Lavender men's formal shirt by Park Avenue', 'FSHIRT-13661', 'Park Avenue', '20000000-0000-0000-0000-000000000001', 2299.00, 2758.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 47, false, '{medium,fair}', 'Lavender'),
('Burgundy Formal Shirt', 'burgundy-formal-shirt-14762', 'Burgundy Formal Shirt — a premium men's formal shirt in Burgundy. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Burgundy men's formal shirt by Raymond', 'FSHIRT-14762', 'Raymond', '20000000-0000-0000-0000-000000000001', 1599.00, 1918.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 20, false, '{deep,medium_dark,medium,fair,very_fair}', 'Burgundy'),
('Olive Green Formal Shirt', 'olive-green-formal-shirt-14784', 'Olive Green Formal Shirt — a premium men's formal shirt in Olive. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Olive men's formal shirt by Van Heusen', 'FSHIRT-14784', 'Van Heusen', '20000000-0000-0000-0000-000000000001', 2099.00, 2518.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 23, false, '{deep,medium_dark,medium}', 'Olive'),
('Pink Formal Shirt', 'pink-formal-shirt-15054', 'Pink Formal Shirt — a premium men's formal shirt in Pink. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Pink men's formal shirt by Peter England', 'FSHIRT-15054', 'Peter England', '20000000-0000-0000-0000-000000000001', 1749.00, 2098.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 26, false, '{medium,fair}', 'Pink'),
('Peach Slim Fit Shirt', 'peach-slim-fit-shirt-15058', 'Peach Slim Fit Shirt — a premium men's formal shirt in Peach. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium Peach men's formal shirt by Arrow', 'FSHIRT-15058', 'Arrow', '20000000-0000-0000-0000-000000000001', 2399.00, 2878.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 29, false, '{deep,medium_dark,medium}', 'Peach'),
('Teal Formal Shirt', 'teal-formal-shirt-15065', 'Teal Formal Shirt — a premium men's formal shirt in Teal. Perfect for business meetings, formal events, and office wear. Crafted by Park Avenue with attention to detail and comfort.', 'Premium Teal men's formal shirt by Park Avenue', 'FSHIRT-15065', 'Park Avenue', '20000000-0000-0000-0000-000000000001', 1349.00, 1618.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 32, false, '{deep,medium_dark,medium}', 'Teal'),
('Mustard Yellow Formal Shirt', 'mustard-yellow-formal-shirt-15111', 'Mustard Yellow Formal Shirt — a premium men's formal shirt in Mustard. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Mustard men's formal shirt by Raymond', 'FSHIRT-15111', 'Raymond', '20000000-0000-0000-0000-000000000001', 1849.00, 2218.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 35, false, '{deep,medium_dark,medium}', 'Mustard'),
('Coral Formal Shirt', 'coral-formal-shirt-15117', 'Coral Formal Shirt — a premium men's formal shirt in Coral. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Coral men's formal shirt by Van Heusen', 'FSHIRT-15117', 'Van Heusen', '20000000-0000-0000-0000-000000000001', 2649.00, 3178.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 38, false, '{medium,fair}', 'Coral'),
('Sea Green Dress Shirt', 'sea-green-dress-shirt-15118', 'Sea Green Dress Shirt — a premium men's formal shirt in Sea Green. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Sea Green men's formal shirt by Peter England', 'FSHIRT-15118', 'Peter England', '20000000-0000-0000-0000-000000000001', 1449.00, 1738.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 41, false, '{medium_dark,medium,fair}', 'Sea Green'),
('Charcoal Grey Formal Trousers', 'charcoal-grey-formal-trousers-16381', 'Charcoal Grey Formal Trousers — a premium men's formal trouser in Charcoal. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Charcoal men's formal trouser by Raymond', 'FTROUSER-16381', 'Raymond', '20000000-0000-0000-0000-000000000002', 1899.00, 2278.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 23, true, '{deep,medium_dark,fair,very_fair}', 'Charcoal'),
('Black Slim Fit Trousers', 'black-slim-fit-trousers-17557', 'Black Slim Fit Trousers — a premium men's formal trouser in Black. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium Black men's formal trouser by Arrow', 'FTROUSER-17557', 'Arrow', '20000000-0000-0000-0000-000000000002', 2199.00, 2638.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 26, true, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Navy Blue Formal Pants', 'navy-blue-formal-pants-17563', 'Navy Blue Formal Pants — a premium men's formal trouser in Navy Blue. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Navy Blue men's formal trouser by Van Heusen', 'FTROUSER-17563', 'Van Heusen', '20000000-0000-0000-0000-000000000002', 2499.00, 2998.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 29, true, '{deep,medium_dark,medium,fair,very_fair}', 'Navy Blue'),
('Grey Wool Blend Trousers', 'grey-wool-blend-trousers-22140', 'Grey Wool Blend Trousers — a premium men's formal trouser in Grey. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Grey men's formal trouser by Raymond', 'FTROUSER-22140', 'Raymond', '20000000-0000-0000-0000-000000000002', 2799.00, 3358.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 32, true, '{deep,medium_dark,fair,very_fair}', 'Grey'),
('Brown Formal Trousers', 'brown-formal-trousers-22154', 'Brown Formal Trousers — a premium men's formal trouser in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Brown men's formal trouser by Peter England', 'FTROUSER-22154', 'Peter England', '20000000-0000-0000-0000-000000000002', 2099.00, 2518.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 35, false, '{deep,medium_dark,medium}', 'Brown'),
('Khaki Formal Chinos', 'khaki-formal-chinos-23180', 'Khaki Formal Chinos — a premium men's formal trouser in Khaki. Perfect for business meetings, formal events, and office wear. Crafted by Park Avenue with attention to detail and comfort.', 'Premium Khaki men's formal trouser by Park Avenue', 'FTROUSER-23180', 'Park Avenue', '20000000-0000-0000-0000-000000000002', 1799.00, 2158.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 38, false, '{medium_dark,medium}', 'Khaki'),
('Beige Formal Trousers', 'beige-formal-trousers-26107', 'Beige Formal Trousers — a premium men's formal trouser in Beige. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Beige men's formal trouser by Raymond', 'FTROUSER-26107', 'Raymond', '20000000-0000-0000-0000-000000000002', 2399.00, 2878.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 41, false, '{medium_dark,medium}', 'Beige'),
('Dark Blue Formal Pants', 'dark-blue-formal-pants-26135', 'Dark Blue Formal Pants — a premium men's formal trouser in Navy Blue. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Navy Blue men's formal trouser by Van Heusen', 'FTROUSER-26135', 'Van Heusen', '20000000-0000-0000-0000-000000000002', 2299.00, 2758.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 44, false, '{deep,medium_dark,medium,fair,very_fair}', 'Navy Blue'),
('Black Pleated Formal Trousers', 'black-pleated-formal-trousers-26166', 'Black Pleated Formal Trousers — a premium men's formal trouser in Black. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium Black men's formal trouser by Arrow', 'FTROUSER-26166', 'Arrow', '20000000-0000-0000-0000-000000000002', 2599.00, 3118.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 47, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Olive Formal Trousers', 'olive-formal-trousers-27170', 'Olive Formal Trousers — a premium men's formal trouser in Olive. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Olive men's formal trouser by Peter England', 'FTROUSER-27170', 'Peter England', '20000000-0000-0000-0000-000000000002', 1999.00, 2398.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 20, false, '{deep,medium_dark,medium}', 'Olive'),
('Cream Linen Formal Trousers', 'cream-linen-formal-trousers-27175', 'Cream Linen Formal Trousers — a premium men's formal trouser in Cream. Perfect for business meetings, formal events, and office wear. Crafted by Park Avenue with attention to detail and comfort.', 'Premium Cream men's formal trouser by Park Avenue', 'FTROUSER-27175', 'Park Avenue', '20000000-0000-0000-0000-000000000002', 2699.00, 3238.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 23, false, '{deep,medium_dark,medium}', 'Cream'),
('Black Patent Leather Shoes', 'black-patent-leather-shoes-7871', 'Black Patent Leather Shoes — a premium men's formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men's formal shoe by Bata', 'FSHOE-7871', 'Bata', '20000000-0000-0000-0000-000000000003', 2999.00, 3598.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 23, true, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Dark Brown Derby Shoes', 'dark-brown-derby-shoes-8885', 'Dark Brown Derby Shoes — a premium men's formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men's formal shoe by Clarks', 'FSHOE-8885', 'Clarks', '20000000-0000-0000-0000-000000000003', 3499.00, 4198.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 26, true, '{deep,medium_dark,medium}', 'Brown'),
('Chestnut Leather Brogues', 'chestnut-leather-brogues-8891', 'Chestnut Leather Brogues — a premium men's formal shoe in Tan. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Tan men's formal shoe by Red Tape', 'FSHOE-8891', 'Red Tape', '20000000-0000-0000-0000-000000000003', 3999.00, 4798.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 29, true, '{deep,medium_dark,medium}', 'Tan'),
('Black Formal Lace-Up Shoes', 'black-formal-lace-up-shoes-8954', 'Black Formal Lace-Up Shoes — a premium men's formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men's formal shoe by Bata', 'FSHOE-8954', 'Bata', '20000000-0000-0000-0000-000000000003', 4499.00, 5398.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 32, true, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Brown Chelsea Boots', 'brown-chelsea-boots-8960', 'Brown Chelsea Boots — a premium men's formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men's formal shoe by Clarks', 'FSHOE-8960', 'Clarks', '20000000-0000-0000-0000-000000000003', 2799.00, 3358.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 35, false, '{deep,medium_dark,medium}', 'Brown'),
('Burgundy Oxford Leather Shoes', 'burgundy-oxford-leather-shoes-9784', 'Burgundy Oxford Leather Shoes — a premium men's formal shoe in Burgundy. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Burgundy men's formal shoe by Red Tape', 'FSHOE-9784', 'Red Tape', '20000000-0000-0000-0000-000000000003', 3299.00, 3958.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 38, false, '{deep,medium_dark,medium,fair,very_fair}', 'Burgundy'),
('Black Oxford Formal Shoes', 'black-oxford-formal-shoes-29708', 'Black Oxford Formal Shoes — a premium men's formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men's formal shoe by Bata', 'FSHOE-29708', 'Bata', '20000000-0000-0000-0000-000000000003', 3799.00, 4558.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 41, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Brown Derby Leather Shoes', 'brown-derby-leather-shoes-31014', 'Brown Derby Leather Shoes — a premium men's formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men's formal shoe by Clarks', 'FSHOE-31014', 'Clarks', '20000000-0000-0000-0000-000000000003', 4299.00, 5158.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 44, false, '{deep,medium_dark,medium}', 'Brown'),
('Tan Oxford Brogues', 'tan-oxford-brogues-31620', 'Tan Oxford Brogues — a premium men's formal shoe in Tan. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Tan men's formal shoe by Clarks', 'FSHOE-31620', 'Clarks', '20000000-0000-0000-0000-000000000003', 2599.00, 3118.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 47, false, '{deep,medium_dark,medium}', 'Tan'),
('Black Monk Strap Shoes', 'black-monk-strap-shoes-32509', 'Black Monk Strap Shoes — a premium men's formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men's formal shoe by Bata', 'FSHOE-32509', 'Bata', '20000000-0000-0000-0000-000000000003', 3099.00, 3718.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 20, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Burgundy Formal Leather Shoes', 'burgundy-formal-leather-shoes-33692', 'Burgundy Formal Leather Shoes — a premium men's formal shoe in Burgundy. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Burgundy men's formal shoe by Red Tape', 'FSHOE-33692', 'Red Tape', '20000000-0000-0000-0000-000000000003', 3599.00, 4318.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 23, false, '{deep,medium_dark,medium,fair,very_fair}', 'Burgundy'),
('Black Derby Formal Shoes', 'black-derby-formal-shoes-35234', 'Black Derby Formal Shoes — a premium men's formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men's formal shoe by Bata', 'FSHOE-35234', 'Bata', '20000000-0000-0000-0000-000000000003', 4099.00, 4918.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 26, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Brown Brogue Oxford Shoes', 'brown-brogue-oxford-shoes-35479', 'Brown Brogue Oxford Shoes — a premium men's formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men's formal shoe by Clarks', 'FSHOE-35479', 'Clarks', '20000000-0000-0000-0000-000000000003', 2699.00, 3238.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 29, false, '{deep,medium_dark,medium}', 'Brown'),
('Tan Loafer Formal Shoes', 'tan-loafer-formal-shoes-35491', 'Tan Loafer Formal Shoes — a premium men's formal shoe in Tan. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Tan men's formal shoe by Red Tape', 'FSHOE-35491', 'Red Tape', '20000000-0000-0000-0000-000000000003', 3199.00, 3838.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 32, false, '{deep,medium_dark,medium}', 'Tan'),
('Black Cap Toe Oxford Shoes', 'black-cap-toe-oxford-shoes-37795', 'Black Cap Toe Oxford Shoes — a premium men's formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men's formal shoe by Bata', 'FSHOE-37795', 'Bata', '20000000-0000-0000-0000-000000000003', 3699.00, 4438.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 35, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Dark Brown Leather Loafers', 'dark-brown-leather-loafers-37802', 'Dark Brown Leather Loafers — a premium men's formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men's formal shoe by Clarks', 'FSHOE-37802', 'Clarks', '20000000-0000-0000-0000-000000000003', 4199.00, 5038.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 38, false, '{deep,medium_dark,medium}', 'Brown'),
('Midnight Blue Formal Shoes', 'midnight-blue-formal-shoes-38983', 'Midnight Blue Formal Shoes — a premium men's formal shoe in Navy Blue. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Navy Blue men's formal shoe by Red Tape', 'FSHOE-38983', 'Red Tape', '20000000-0000-0000-0000-000000000003', 2899.00, 3478.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 41, false, '{deep,medium_dark,medium,fair,very_fair}', 'Navy Blue'),
('Brown Wingtip Dress Shoes', 'brown-wingtip-dress-shoes-39810', 'Brown Wingtip Dress Shoes — a premium men's formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men's formal shoe by Clarks', 'FSHOE-39810', 'Clarks', '20000000-0000-0000-0000-000000000003', 3399.00, 4078.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 44, false, '{deep,medium_dark,medium}', 'Brown'),
('Black Slip-On Formal Shoes', 'black-slip-on-formal-shoes-39811', 'Black Slip-On Formal Shoes — a premium men's formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men's formal shoe by Bata', 'FSHOE-39811', 'Bata', '20000000-0000-0000-0000-000000000003', 3899.00, 4678.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 47, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Tan Formal Leather Shoes', 'tan-formal-leather-shoes-40449', 'Tan Formal Leather Shoes — a premium men's formal shoe in Tan. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Tan men's formal shoe by Red Tape', 'FSHOE-40449', 'Red Tape', '20000000-0000-0000-0000-000000000003', 4399.00, 5278.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 20, false, '{deep,medium_dark,medium}', 'Tan'),
('Cognac Oxford Dress Shoes', 'cognac-oxford-dress-shoes-44416', 'Cognac Oxford Dress Shoes — a premium men's formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men's formal shoe by Clarks', 'FSHOE-44416', 'Clarks', '20000000-0000-0000-0000-000000000003', 2499.00, 2998.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 23, false, '{deep,medium_dark,medium}', 'Brown')
;

-- Step 5: Insert product images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649077/boutique/formal-mens/formal_shirts_10260.jpg', 'White Formal Dress Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-10260';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649078/boutique/formal-mens/formal_shirts_11110.jpg', 'Light Blue Oxford Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-11110';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649079/boutique/formal-mens/formal_shirts_11162.jpg', 'Navy Blue Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-11162';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649080/boutique/formal-mens/formal_shirts_12220.jpg', 'Slim Fit White Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12220';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649081/boutique/formal-mens/formal_shirts_12255.jpg', 'Blue Striped Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12255';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649081/boutique/formal-mens/formal_shirts_12274.jpg', 'Charcoal Grey Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12274';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649082/boutique/formal-mens/formal_shirts_12289.jpg', 'Cream Formal Dress Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12289';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649083/boutique/formal-mens/formal_shirts_12297.jpg', 'Black Formal Business Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12297';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649084/boutique/formal-mens/formal_shirts_13661.jpg', 'Lavender Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-13661';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649085/boutique/formal-mens/formal_shirts_14762.jpg', 'Burgundy Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-14762';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649086/boutique/formal-mens/formal_shirts_14784.jpg', 'Olive Green Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-14784';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649086/boutique/formal-mens/formal_shirts_15054.jpg', 'Pink Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15054';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649087/boutique/formal-mens/formal_shirts_15058.jpg', 'Peach Slim Fit Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15058';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649088/boutique/formal-mens/formal_shirts_15065.jpg', 'Teal Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15065';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649089/boutique/formal-mens/formal_shirts_15111.jpg', 'Mustard Yellow Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15111';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649090/boutique/formal-mens/formal_shirts_15117.jpg', 'Coral Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15117';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649091/boutique/formal-mens/formal_shirts_15118.jpg', 'Sea Green Dress Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15118';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649092/boutique/formal-mens/formal_trousers_16381.jpg', 'Charcoal Grey Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-16381';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649093/boutique/formal-mens/formal_trousers_17557.jpg', 'Black Slim Fit Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-17557';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649094/boutique/formal-mens/formal_trousers_17563.jpg', 'Navy Blue Formal Pants - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-17563';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649095/boutique/formal-mens/formal_trousers_22140.jpg', 'Grey Wool Blend Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-22140';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649096/boutique/formal-mens/formal_trousers_22154.jpg', 'Brown Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-22154';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649097/boutique/formal-mens/formal_trousers_23180.jpg', 'Khaki Formal Chinos - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-23180';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649097/boutique/formal-mens/formal_trousers_26107.jpg', 'Beige Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-26107';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649098/boutique/formal-mens/formal_trousers_26135.jpg', 'Dark Blue Formal Pants - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-26135';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649099/boutique/formal-mens/formal_trousers_26166.jpg', 'Black Pleated Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-26166';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649100/boutique/formal-mens/formal_trousers_27170.jpg', 'Olive Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-27170';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649100/boutique/formal-mens/formal_trousers_27175.jpg', 'Cream Linen Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-27175';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649113/boutique/formal-mens/formal_shoes_7871.jpg', 'Black Patent Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-7871';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649114/boutique/formal-mens/formal_shoes_8885.jpg', 'Dark Brown Derby Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-8885';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649115/boutique/formal-mens/formal_shoes_8891.jpg', 'Chestnut Leather Brogues - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-8891';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649116/boutique/formal-mens/formal_shoes_8954.jpg', 'Black Formal Lace-Up Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-8954';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649116/boutique/formal-mens/formal_shoes_8960.jpg', 'Brown Chelsea Boots - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-8960';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649118/boutique/formal-mens/formal_shoes_9784.jpg', 'Burgundy Oxford Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-9784';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649101/boutique/formal-mens/formal_shoes_29708.jpg', 'Black Oxford Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-29708';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649102/boutique/formal-mens/formal_shoes_31014.jpg', 'Brown Derby Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-31014';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649103/boutique/formal-mens/formal_shoes_31620.jpg', 'Tan Oxford Brogues - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-31620';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649104/boutique/formal-mens/formal_shoes_32509.jpg', 'Black Monk Strap Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-32509';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649104/boutique/formal-mens/formal_shoes_33692.jpg', 'Burgundy Formal Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-33692';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649105/boutique/formal-mens/formal_shoes_35234.jpg', 'Black Derby Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-35234';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649106/boutique/formal-mens/formal_shoes_35479.jpg', 'Brown Brogue Oxford Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-35479';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649107/boutique/formal-mens/formal_shoes_35491.jpg', 'Tan Loafer Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-35491';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649108/boutique/formal-mens/formal_shoes_37795.jpg', 'Black Cap Toe Oxford Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-37795';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649109/boutique/formal-mens/formal_shoes_37802.jpg', 'Dark Brown Leather Loafers - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-37802';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649110/boutique/formal-mens/formal_shoes_38983.jpg', 'Midnight Blue Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-38983';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649111/boutique/formal-mens/formal_shoes_39810.jpg', 'Brown Wingtip Dress Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-39810';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649111/boutique/formal-mens/formal_shoes_39811.jpg', 'Black Slip-On Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-39811';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649112/boutique/formal-mens/formal_shoes_40449.jpg', 'Tan Formal Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-40449';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649113/boutique/formal-mens/formal_shoes_44416.jpg', 'Cognac Oxford Dress Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-44416';
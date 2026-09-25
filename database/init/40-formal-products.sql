-- ============================================================
-- Men's Formal Wear Product Seed
-- Generated from Kaggle images uploaded to Cloudinary
-- ============================================================

\c products_db


-- Step 2: Insert new formal menswear categories
INSERT INTO categories (id, name, description, created_at, updated_at) VALUES
('20000000-0000-0000-0000-000000000001', 'Formal Shirts', 'Premium formal dress shirts and business shirts for men', NOW(), NOW()),
('20000000-0000-0000-0000-000000000002', 'Trousers & Pants', 'Tailored formal trousers and suit pants for men', NOW(), NOW()),
('20000000-0000-0000-0000-000000000003', 'Formal Shoes', 'Oxford, Derby, loafer and formal leather shoes for men', NOW(), NOW()),
('20000000-0000-0000-0000-000000000004', 'Blazers', 'Single and double-breasted blazers and dinner jackets, many handcrafted to measure', NOW(), NOW()),
('20000000-0000-0000-0000-000000000005', 'Suits & Waistcoats', 'Two and three-piece suits, tuxedos and waistcoats, tailored by hand', NOW(), NOW()),
('20000000-0000-0000-0000-000000000006', 'Coats & Overcoats', 'Wool overcoats, topcoats and trench coats for formal dressing', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Insert formal products
INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price, materials, care_instructions, inventory_quantity, is_featured, skin_tone_tags, base_colour) VALUES

('White Formal Dress Shirt', 'white-formal-dress-shirt-10260', 'White Formal Dress Shirt — a premium men''s formal shirt in White. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium White men''s formal shirt by Arrow', 'FSHIRT-10260', 'Arrow', '20000000-0000-0000-0000-000000000001', 1299.00, 1558.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 23, true, '{deep,medium_dark,medium,fair,very_fair}', 'White'),
('Light Blue Oxford Shirt', 'light-blue-oxford-shirt-11110', 'Light Blue Oxford Shirt — a premium men''s formal shirt in Light Blue. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Light Blue men''s formal shirt by Van Heusen', 'FSHIRT-11110', 'Van Heusen', '20000000-0000-0000-0000-000000000001', 1499.00, 1798.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 26, true, '{medium,fair,very_fair}', 'Light Blue'),
('Navy Blue Formal Shirt', 'navy-blue-formal-shirt-11162', 'Navy Blue Formal Shirt — a premium men''s formal shirt in Navy Blue. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Navy Blue men''s formal shirt by Peter England', 'FSHIRT-11162', 'Peter England', '20000000-0000-0000-0000-000000000001', 1699.00, 2038.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 29, true, '{deep,medium_dark,medium,fair,very_fair}', 'Navy Blue'),
('Slim Fit White Shirt', 'slim-fit-white-shirt-12220', 'Slim Fit White Shirt — a premium men''s formal shirt in White. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium White men''s formal shirt by Arrow', 'FSHIRT-12220', 'Arrow', '20000000-0000-0000-0000-000000000001', 1899.00, 2278.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 32, true, '{deep,medium_dark,medium,fair,very_fair}', 'White'),
('Blue Striped Formal Shirt', 'blue-striped-formal-shirt-12255', 'Blue Striped Formal Shirt — a premium men''s formal shirt in Blue. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Blue men''s formal shirt by Raymond', 'FSHIRT-12255', 'Raymond', '20000000-0000-0000-0000-000000000001', 2199.00, 2638.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 35, false, '{medium_dark,medium,fair,very_fair}', 'Blue'),
('Charcoal Grey Formal Shirt', 'charcoal-grey-formal-shirt-12274', 'Charcoal Grey Formal Shirt — a premium men''s formal shirt in Grey. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Grey men''s formal shirt by Van Heusen', 'FSHIRT-12274', 'Van Heusen', '20000000-0000-0000-0000-000000000001', 2499.00, 2998.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 38, false, '{deep,medium_dark,fair,very_fair}', 'Grey'),
('Cream Formal Dress Shirt', 'cream-formal-dress-shirt-12289', 'Cream Formal Dress Shirt — a premium men''s formal shirt in Cream. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Cream men''s formal shirt by Peter England', 'FSHIRT-12289', 'Peter England', '20000000-0000-0000-0000-000000000001', 2799.00, 3358.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 41, false, '{deep,medium_dark,medium}', 'Cream'),
('Black Formal Business Shirt', 'black-formal-business-shirt-12297', 'Black Formal Business Shirt — a premium men''s formal shirt in Black. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium Black men''s formal shirt by Arrow', 'FSHIRT-12297', 'Arrow', '20000000-0000-0000-0000-000000000001', 1999.00, 2398.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 44, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Lavender Formal Shirt', 'lavender-formal-shirt-13661', 'Lavender Formal Shirt — a premium men''s formal shirt in Lavender. Perfect for business meetings, formal events, and office wear. Crafted by Park Avenue with attention to detail and comfort.', 'Premium Lavender men''s formal shirt by Park Avenue', 'FSHIRT-13661', 'Park Avenue', '20000000-0000-0000-0000-000000000001', 2299.00, 2758.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 47, false, '{medium,fair}', 'Lavender'),
('Burgundy Formal Shirt', 'burgundy-formal-shirt-14762', 'Burgundy Formal Shirt — a premium men''s formal shirt in Burgundy. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Burgundy men''s formal shirt by Raymond', 'FSHIRT-14762', 'Raymond', '20000000-0000-0000-0000-000000000001', 1599.00, 1918.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 20, false, '{deep,medium_dark,medium,fair,very_fair}', 'Burgundy'),
('Olive Green Formal Shirt', 'olive-green-formal-shirt-14784', 'Olive Green Formal Shirt — a premium men''s formal shirt in Olive. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Olive men''s formal shirt by Van Heusen', 'FSHIRT-14784', 'Van Heusen', '20000000-0000-0000-0000-000000000001', 2099.00, 2518.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 23, false, '{deep,medium_dark,medium}', 'Olive'),
('Pink Formal Shirt', 'pink-formal-shirt-15054', 'Pink Formal Shirt — a premium men''s formal shirt in Pink. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Pink men''s formal shirt by Peter England', 'FSHIRT-15054', 'Peter England', '20000000-0000-0000-0000-000000000001', 1749.00, 2098.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 26, false, '{medium,fair}', 'Pink'),
('Peach Slim Fit Shirt', 'peach-slim-fit-shirt-15058', 'Peach Slim Fit Shirt — a premium men''s formal shirt in Peach. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium Peach men''s formal shirt by Arrow', 'FSHIRT-15058', 'Arrow', '20000000-0000-0000-0000-000000000001', 2399.00, 2878.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 29, false, '{deep,medium_dark,medium}', 'Peach'),
('Teal Formal Shirt', 'teal-formal-shirt-15065', 'Teal Formal Shirt — a premium men''s formal shirt in Teal. Perfect for business meetings, formal events, and office wear. Crafted by Park Avenue with attention to detail and comfort.', 'Premium Teal men''s formal shirt by Park Avenue', 'FSHIRT-15065', 'Park Avenue', '20000000-0000-0000-0000-000000000001', 1349.00, 1618.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 32, false, '{deep,medium_dark,medium}', 'Teal'),
('Mustard Yellow Formal Shirt', 'mustard-yellow-formal-shirt-15111', 'Mustard Yellow Formal Shirt — a premium men''s formal shirt in Mustard. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Mustard men''s formal shirt by Raymond', 'FSHIRT-15111', 'Raymond', '20000000-0000-0000-0000-000000000001', 1849.00, 2218.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 35, false, '{deep,medium_dark,medium}', 'Mustard'),
('Coral Formal Shirt', 'coral-formal-shirt-15117', 'Coral Formal Shirt — a premium men''s formal shirt in Coral. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Coral men''s formal shirt by Van Heusen', 'FSHIRT-15117', 'Van Heusen', '20000000-0000-0000-0000-000000000001', 2649.00, 3178.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 38, false, '{medium,fair}', 'Coral'),
('Sea Green Dress Shirt', 'sea-green-dress-shirt-15118', 'Sea Green Dress Shirt — a premium men''s formal shirt in Sea Green. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Sea Green men''s formal shirt by Peter England', 'FSHIRT-15118', 'Peter England', '20000000-0000-0000-0000-000000000001', 1449.00, 1738.00, '100% Premium Cotton', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 41, false, '{medium_dark,medium,fair}', 'Sea Green'),
('Charcoal Grey Formal Trousers', 'charcoal-grey-formal-trousers-16381', 'Charcoal Grey Formal Trousers — a premium men''s formal trouser in Charcoal. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Charcoal men''s formal trouser by Raymond', 'FTROUSER-16381', 'Raymond', '20000000-0000-0000-0000-000000000002', 1899.00, 2278.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 23, true, '{deep,medium_dark,fair,very_fair}', 'Charcoal'),
('Black Slim Fit Trousers', 'black-slim-fit-trousers-17557', 'Black Slim Fit Trousers — a premium men''s formal trouser in Black. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium Black men''s formal trouser by Arrow', 'FTROUSER-17557', 'Arrow', '20000000-0000-0000-0000-000000000002', 2199.00, 2638.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 26, true, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Navy Blue Formal Pants', 'navy-blue-formal-pants-17563', 'Navy Blue Formal Pants — a premium men''s formal trouser in Navy Blue. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Navy Blue men''s formal trouser by Van Heusen', 'FTROUSER-17563', 'Van Heusen', '20000000-0000-0000-0000-000000000002', 2499.00, 2998.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 29, true, '{deep,medium_dark,medium,fair,very_fair}', 'Navy Blue'),
('Grey Wool Blend Trousers', 'grey-wool-blend-trousers-22140', 'Grey Wool Blend Trousers — a premium men''s formal trouser in Grey. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Grey men''s formal trouser by Raymond', 'FTROUSER-22140', 'Raymond', '20000000-0000-0000-0000-000000000002', 2799.00, 3358.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 32, true, '{deep,medium_dark,fair,very_fair}', 'Grey'),
('Brown Formal Trousers', 'brown-formal-trousers-22154', 'Brown Formal Trousers — a premium men''s formal trouser in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Brown men''s formal trouser by Peter England', 'FTROUSER-22154', 'Peter England', '20000000-0000-0000-0000-000000000002', 2099.00, 2518.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 35, false, '{deep,medium_dark,medium}', 'Brown'),
('Khaki Formal Chinos', 'khaki-formal-chinos-23180', 'Khaki Formal Chinos — a premium men''s formal trouser in Khaki. Perfect for business meetings, formal events, and office wear. Crafted by Park Avenue with attention to detail and comfort.', 'Premium Khaki men''s formal trouser by Park Avenue', 'FTROUSER-23180', 'Park Avenue', '20000000-0000-0000-0000-000000000002', 1799.00, 2158.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 38, false, '{medium_dark,medium}', 'Khaki'),
('Beige Formal Trousers', 'beige-formal-trousers-26107', 'Beige Formal Trousers — a premium men''s formal trouser in Beige. Perfect for business meetings, formal events, and office wear. Crafted by Raymond with attention to detail and comfort.', 'Premium Beige men''s formal trouser by Raymond', 'FTROUSER-26107', 'Raymond', '20000000-0000-0000-0000-000000000002', 2399.00, 2878.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 41, false, '{medium_dark,medium}', 'Beige'),
('Dark Blue Formal Pants', 'dark-blue-formal-pants-26135', 'Dark Blue Formal Pants — a premium men''s formal trouser in Navy Blue. Perfect for business meetings, formal events, and office wear. Crafted by Van Heusen with attention to detail and comfort.', 'Premium Navy Blue men''s formal trouser by Van Heusen', 'FTROUSER-26135', 'Van Heusen', '20000000-0000-0000-0000-000000000002', 2299.00, 2758.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 44, false, '{deep,medium_dark,medium,fair,very_fair}', 'Navy Blue'),
('Black Pleated Formal Trousers', 'black-pleated-formal-trousers-26166', 'Black Pleated Formal Trousers — a premium men''s formal trouser in Black. Perfect for business meetings, formal events, and office wear. Crafted by Arrow with attention to detail and comfort.', 'Premium Black men''s formal trouser by Arrow', 'FTROUSER-26166', 'Arrow', '20000000-0000-0000-0000-000000000002', 2599.00, 3118.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 47, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Olive Formal Trousers', 'olive-formal-trousers-27170', 'Olive Formal Trousers — a premium men''s formal trouser in Olive. Perfect for business meetings, formal events, and office wear. Crafted by Peter England with attention to detail and comfort.', 'Premium Olive men''s formal trouser by Peter England', 'FTROUSER-27170', 'Peter England', '20000000-0000-0000-0000-000000000002', 1999.00, 2398.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 20, false, '{deep,medium_dark,medium}', 'Olive'),
('Cream Linen Formal Trousers', 'cream-linen-formal-trousers-27175', 'Cream Linen Formal Trousers — a premium men''s formal trouser in Cream. Perfect for business meetings, formal events, and office wear. Crafted by Park Avenue with attention to detail and comfort.', 'Premium Cream men''s formal trouser by Park Avenue', 'FTROUSER-27175', 'Park Avenue', '20000000-0000-0000-0000-000000000002', 2699.00, 3238.00, 'Poly-Viscose Blend, Partially Lined', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 23, false, '{deep,medium_dark,medium}', 'Cream'),
('Black Patent Leather Shoes', 'black-patent-leather-shoes-7871', 'Black Patent Leather Shoes — a premium men''s formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men''s formal shoe by Bata', 'FSHOE-7871', 'Bata', '20000000-0000-0000-0000-000000000003', 2999.00, 3598.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 23, true, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Dark Brown Derby Shoes', 'dark-brown-derby-shoes-8885', 'Dark Brown Derby Shoes — a premium men''s formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men''s formal shoe by Clarks', 'FSHOE-8885', 'Clarks', '20000000-0000-0000-0000-000000000003', 3499.00, 4198.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 26, true, '{deep,medium_dark,medium}', 'Brown'),
('Chestnut Leather Brogues', 'chestnut-leather-brogues-8891', 'Chestnut Leather Brogues — a premium men''s formal shoe in Tan. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Tan men''s formal shoe by Red Tape', 'FSHOE-8891', 'Red Tape', '20000000-0000-0000-0000-000000000003', 3999.00, 4798.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 29, true, '{deep,medium_dark,medium}', 'Tan'),
('Black Formal Lace-Up Shoes', 'black-formal-lace-up-shoes-8954', 'Black Formal Lace-Up Shoes — a premium men''s formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men''s formal shoe by Bata', 'FSHOE-8954', 'Bata', '20000000-0000-0000-0000-000000000003', 4499.00, 5398.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 32, true, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Brown Chelsea Boots', 'brown-chelsea-boots-8960', 'Brown Chelsea Boots — a premium men''s formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men''s formal shoe by Clarks', 'FSHOE-8960', 'Clarks', '20000000-0000-0000-0000-000000000003', 2799.00, 3358.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 35, false, '{deep,medium_dark,medium}', 'Brown'),
('Burgundy Oxford Leather Shoes', 'burgundy-oxford-leather-shoes-9784', 'Burgundy Oxford Leather Shoes — a premium men''s formal shoe in Burgundy. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Burgundy men''s formal shoe by Red Tape', 'FSHOE-9784', 'Red Tape', '20000000-0000-0000-0000-000000000003', 3299.00, 3958.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 38, false, '{deep,medium_dark,medium,fair,very_fair}', 'Burgundy'),
('Black Oxford Formal Shoes', 'black-oxford-formal-shoes-29708', 'Black Oxford Formal Shoes — a premium men''s formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men''s formal shoe by Bata', 'FSHOE-29708', 'Bata', '20000000-0000-0000-0000-000000000003', 3799.00, 4558.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 41, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Brown Derby Leather Shoes', 'brown-derby-leather-shoes-31014', 'Brown Derby Leather Shoes — a premium men''s formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men''s formal shoe by Clarks', 'FSHOE-31014', 'Clarks', '20000000-0000-0000-0000-000000000003', 4299.00, 5158.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 44, false, '{deep,medium_dark,medium}', 'Brown'),
('Tan Oxford Brogues', 'tan-oxford-brogues-31620', 'Tan Oxford Brogues — a premium men''s formal shoe in Tan. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Tan men''s formal shoe by Clarks', 'FSHOE-31620', 'Clarks', '20000000-0000-0000-0000-000000000003', 2599.00, 3118.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 47, false, '{deep,medium_dark,medium}', 'Tan'),
('Black Monk Strap Shoes', 'black-monk-strap-shoes-32509', 'Black Monk Strap Shoes — a premium men''s formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men''s formal shoe by Bata', 'FSHOE-32509', 'Bata', '20000000-0000-0000-0000-000000000003', 3099.00, 3718.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 20, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Burgundy Formal Leather Shoes', 'burgundy-formal-leather-shoes-33692', 'Burgundy Formal Leather Shoes — a premium men''s formal shoe in Burgundy. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Burgundy men''s formal shoe by Red Tape', 'FSHOE-33692', 'Red Tape', '20000000-0000-0000-0000-000000000003', 3599.00, 4318.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 23, false, '{deep,medium_dark,medium,fair,very_fair}', 'Burgundy'),
('Black Derby Formal Shoes', 'black-derby-formal-shoes-35234', 'Black Derby Formal Shoes — a premium men''s formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men''s formal shoe by Bata', 'FSHOE-35234', 'Bata', '20000000-0000-0000-0000-000000000003', 4099.00, 4918.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 26, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Brown Brogue Oxford Shoes', 'brown-brogue-oxford-shoes-35479', 'Brown Brogue Oxford Shoes — a premium men''s formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men''s formal shoe by Clarks', 'FSHOE-35479', 'Clarks', '20000000-0000-0000-0000-000000000003', 2699.00, 3238.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 29, false, '{deep,medium_dark,medium}', 'Brown'),
('Tan Loafer Formal Shoes', 'tan-loafer-formal-shoes-35491', 'Tan Loafer Formal Shoes — a premium men''s formal shoe in Tan. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Tan men''s formal shoe by Red Tape', 'FSHOE-35491', 'Red Tape', '20000000-0000-0000-0000-000000000003', 3199.00, 3838.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 32, false, '{deep,medium_dark,medium}', 'Tan'),
('Black Cap Toe Oxford Shoes', 'black-cap-toe-oxford-shoes-37795', 'Black Cap Toe Oxford Shoes — a premium men''s formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men''s formal shoe by Bata', 'FSHOE-37795', 'Bata', '20000000-0000-0000-0000-000000000003', 3699.00, 4438.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 35, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Dark Brown Leather Loafers', 'dark-brown-leather-loafers-37802', 'Dark Brown Leather Loafers — a premium men''s formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men''s formal shoe by Clarks', 'FSHOE-37802', 'Clarks', '20000000-0000-0000-0000-000000000003', 4199.00, 5038.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 38, false, '{deep,medium_dark,medium}', 'Brown'),
('Midnight Blue Formal Shoes', 'midnight-blue-formal-shoes-38983', 'Midnight Blue Formal Shoes — a premium men''s formal shoe in Navy Blue. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Navy Blue men''s formal shoe by Red Tape', 'FSHOE-38983', 'Red Tape', '20000000-0000-0000-0000-000000000003', 2899.00, 3478.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 41, false, '{deep,medium_dark,medium,fair,very_fair}', 'Navy Blue'),
('Brown Wingtip Dress Shoes', 'brown-wingtip-dress-shoes-39810', 'Brown Wingtip Dress Shoes — a premium men''s formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men''s formal shoe by Clarks', 'FSHOE-39810', 'Clarks', '20000000-0000-0000-0000-000000000003', 3399.00, 4078.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 44, false, '{deep,medium_dark,medium}', 'Brown'),
('Black Slip-On Formal Shoes', 'black-slip-on-formal-shoes-39811', 'Black Slip-On Formal Shoes — a premium men''s formal shoe in Black. Perfect for business meetings, formal events, and office wear. Crafted by Bata with attention to detail and comfort.', 'Premium Black men''s formal shoe by Bata', 'FSHOE-39811', 'Bata', '20000000-0000-0000-0000-000000000003', 3899.00, 4678.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 47, false, '{deep,medium_dark,fair,very_fair}', 'Black'),
('Tan Formal Leather Shoes', 'tan-formal-leather-shoes-40449', 'Tan Formal Leather Shoes — a premium men''s formal shoe in Tan. Perfect for business meetings, formal events, and office wear. Crafted by Red Tape with attention to detail and comfort.', 'Premium Tan men''s formal shoe by Red Tape', 'FSHOE-40449', 'Red Tape', '20000000-0000-0000-0000-000000000003', 4399.00, 5278.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 20, false, '{deep,medium_dark,medium}', 'Tan'),
('Cognac Oxford Dress Shoes', 'cognac-oxford-dress-shoes-44416', 'Cognac Oxford Dress Shoes — a premium men''s formal shoe in Brown. Perfect for business meetings, formal events, and office wear. Crafted by Clarks with attention to detail and comfort.', 'Premium Brown men''s formal shoe by Clarks', 'FSHOE-44416', 'Clarks', '20000000-0000-0000-0000-000000000003', 2499.00, 2998.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 23, false, '{deep,medium_dark,medium}', 'Brown')
;

-- Step 5: Insert product images
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649109/boutique/formal-mens/formal_shoes_37802.jpg', 'White Formal Dress Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-10260';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649083/boutique/formal-mens/formal_shirts_12297.jpg', 'Light Blue Oxford Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-11110';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649081/boutique/formal-mens/formal_shirts_12274.jpg', 'Navy Blue Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-11162';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649078/boutique/formal-mens/formal_shirts_11110.jpg', 'Slim Fit White Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12220';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649085/boutique/formal-mens/formal_shirts_14762.jpg', 'Blue Striped Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12255';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649103/boutique/formal-mens/formal_shoes_31620.jpg', 'Charcoal Grey Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12274';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649100/boutique/formal-mens/formal_trousers_27175.jpg', 'Cream Formal Dress Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12289';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649079/boutique/formal-mens/formal_shirts_11162.jpg', 'Black Formal Business Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-12297';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649093/boutique/formal-mens/formal_trousers_17557.jpg', 'Lavender Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-13661';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649081/boutique/formal-mens/formal_shirts_12255.jpg', 'Burgundy Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-14762';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649115/boutique/formal-mens/formal_shoes_8891.jpg', 'Olive Green Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-14784';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649086/boutique/formal-mens/formal_shirts_14784.jpg', 'Pink Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15054';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649094/boutique/formal-mens/formal_trousers_17563.jpg', 'Peach Slim Fit Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15058';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649097/boutique/formal-mens/formal_trousers_23180.jpg', 'Teal Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15065';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649084/boutique/formal-mens/formal_shirts_13661.jpg', 'Mustard Yellow Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15111';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649101/boutique/formal-mens/formal_shoes_29708.jpg', 'Coral Formal Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15117';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649108/boutique/formal-mens/formal_shoes_37795.jpg', 'Sea Green Dress Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-15118';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649082/boutique/formal-mens/formal_shirts_12289.jpg', 'Charcoal Grey Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-16381';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649080/boutique/formal-mens/formal_shirts_12220.jpg', 'Black Slim Fit Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-17557';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649092/boutique/formal-mens/formal_trousers_16381.jpg', 'Navy Blue Formal Pants - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-17563';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649077/boutique/formal-mens/formal_shirts_10260.jpg', 'Grey Wool Blend Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-22140';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649089/boutique/formal-mens/formal_shirts_15111.jpg', 'Brown Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-22154';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649098/boutique/formal-mens/formal_trousers_26135.jpg', 'Khaki Formal Chinos - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-23180';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649090/boutique/formal-mens/formal_shirts_15117.jpg', 'Beige Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-26107';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649102/boutique/formal-mens/formal_shoes_31014.jpg', 'Dark Blue Formal Pants - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-26135';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649091/boutique/formal-mens/formal_shirts_15118.jpg', 'Black Pleated Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-26166';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649114/boutique/formal-mens/formal_shoes_8885.jpg', 'Olive Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-27170';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649098/boutique/formal-mens/formal_trousers_26135.jpg', 'Cream Linen Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-27175';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649113/boutique/formal-mens/formal_shoes_7871.jpg', 'Black Patent Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-7871';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649087/boutique/formal-mens/formal_shirts_15058.jpg', 'Dark Brown Derby Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-8885';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649112/boutique/formal-mens/formal_shoes_40449.jpg', 'Chestnut Leather Brogues - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-8891';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649086/boutique/formal-mens/formal_shirts_15054.jpg', 'Black Formal Lace-Up Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-8954';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649104/boutique/formal-mens/formal_shoes_33692.jpg', 'Brown Chelsea Boots - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-8960';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649105/boutique/formal-mens/formal_shoes_35234.jpg', 'Burgundy Oxford Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-9784';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649116/boutique/formal-mens/formal_shoes_8960.jpg', 'Black Oxford Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-29708';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649106/boutique/formal-mens/formal_shoes_35479.jpg', 'Brown Derby Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-31014';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649112/boutique/formal-mens/formal_shoes_40449.jpg', 'Tan Oxford Brogues - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-31620';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649095/boutique/formal-mens/formal_trousers_22140.jpg', 'Black Monk Strap Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-32509';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649105/boutique/formal-mens/formal_shoes_35234.jpg', 'Burgundy Formal Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-33692';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649113/boutique/formal-mens/formal_shoes_44416.jpg', 'Black Derby Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-35234';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649087/boutique/formal-mens/formal_shirts_15058.jpg', 'Brown Brogue Oxford Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-35479';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649118/boutique/formal-mens/formal_shoes_9784.jpg', 'Tan Loafer Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-35491';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649086/boutique/formal-mens/formal_shirts_15054.jpg', 'Black Cap Toe Oxford Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-37795';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649104/boutique/formal-mens/formal_shoes_33692.jpg', 'Dark Brown Leather Loafers - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-37802';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649088/boutique/formal-mens/formal_shirts_15065.jpg', 'Midnight Blue Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-38983';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649106/boutique/formal-mens/formal_shoes_35479.jpg', 'Brown Wingtip Dress Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-39810';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649096/boutique/formal-mens/formal_trousers_22154.jpg', 'Black Slip-On Formal Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-39811';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649118/boutique/formal-mens/formal_shoes_9784.jpg', 'Tan Formal Leather Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-40449';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787649107/boutique/formal-mens/formal_shoes_35491.jpg', 'Cognac Oxford Dress Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-44416';

-- Tailoring: blazers, suits & waistcoats, coats & overcoats.
-- Photos: Unsplash (free licence, https://unsplash.com/license).
INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price, materials, care_instructions, inventory_quantity, is_featured, skin_tone_tags, base_colour, is_handcrafted, made_to_measure, making_days) VALUES
('Navy Hopsack Blazer', 'navy-hopsack-blazer-50101', 'A navy hopsack blazer cut and finished by hand in our atelier. The open weave breathes in warm weather, the half-canvas front shapes to you over time, and the lapels carry hand-stitched pick stitching. Choose a standard size or send us your measurements and we will tailor one for you.', 'Handcrafted navy hopsack blazer, made to your measurements', 'FBLZ-50101', 'Lux Atelier', '20000000-0000-0000-0000-000000000004', 12999.00, 15999.00, '100% Wool Hopsack, Bemberg Cupro Lining, Horn Buttons', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 12, true, '{deep,medium_dark,medium,fair,very_fair}', 'Navy', true, true, 14),
('Grey Check Tweed Blazer', 'grey-check-tweed-blazer-50102', 'A soft-shouldered tweed blazer in grey check, handcrafted with a half-canvas front and hand-sewn buttonholes. Wear it with flannel trousers for the office or over a roll-neck at the weekend. Available in standard sizes or made to measure.', 'Handcrafted grey tweed blazer with a subtle check', 'FBLZ-50102', 'Lux Atelier', '20000000-0000-0000-0000-000000000004', 14999.00, 17999.00, '100% Wool Tweed, Half-Canvas Construction, Viscose Lining', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 8, false, '{deep,medium_dark,medium,fair}', 'Grey', true, true, 18),
('Charcoal Melange Blazer', 'charcoal-melange-blazer-50103', 'A versatile charcoal melange blazer with a notch lapel, two-button front and flap pockets. Structured enough for meetings and easy enough to wear with denim.', 'Everyday charcoal melange blazer by Raymond', 'FBLZ-50103', 'Raymond', '20000000-0000-0000-0000-000000000004', 7999.00, 9599.00, '70% Wool, 30% Polyester, Polyester Lining', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 20, false, '{deep,medium_dark,medium,fair,very_fair}', 'Charcoal', false, false, NULL),
('Sage Windowpane Blazer', 'sage-windowpane-blazer-50104', 'A statement blazer in sage windowpane wool, handcrafted with a full-canvas chest, peak lapels and hand-finished edges. Made to measure so the check lines up exactly across your seams.', 'Handcrafted sage windowpane blazer for occasions', 'FBLZ-50104', 'Lux Atelier', '20000000-0000-0000-0000-000000000004', 16999.00, 19999.00, '100% Wool, Windowpane Check, Bemberg Cupro Lining, Corozo Buttons', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 6, true, '{medium_dark,medium,fair,very_fair}', 'Green', true, true, 21),
('Burgundy Velvet Dinner Jacket', 'burgundy-velvet-dinner-jacket-50105', 'A burgundy velvet dinner jacket with a satin shawl lapel and silk lining, cut and finished by hand for evening wear. Pair it with black tuxedo trousers and a bow tie.', 'Handcrafted burgundy velvet dinner jacket', 'FBLZ-50105', 'Lux Atelier', '20000000-0000-0000-0000-000000000004', 18999.00, 22999.00, 'Cotton Velvet, Satin Shawl Lapel, Silk Lining', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 5, true, '{deep,medium_dark,medium,fair}', 'Burgundy', true, true, 21),
('Black Notch-Lapel Blazer', 'black-notch-lapel-blazer-50106', 'A sharp slim-fit black blazer with a notch lapel and single-button front. A reliable piece for evening events and formal dinners.', 'Slim-fit black blazer by Blackberrys', 'FBLZ-50106', 'Blackberrys', '20000000-0000-0000-0000-000000000004', 8999.00, 10799.00, '65% Polyester, 35% Viscose, Polyester Lining', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 18, false, '{deep,medium_dark,medium,fair,very_fair}', 'Black', false, false, NULL),
('Royal Blue Two-Piece Suit', 'royal-blue-two-piece-suit-51101', 'A royal blue two-piece suit in fine worsted wool with a slim notch-lapel jacket and flat-front trousers. Buy it in a standard size or order it made to your measurements.', 'Royal blue two-piece suit, off the peg or made to measure', 'FSUIT-51101', 'Louis Philippe', '20000000-0000-0000-0000-000000000005', 19999.00, 23999.00, '100% Wool, Polyester Lining', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 10, true, '{deep,medium_dark,medium,fair,very_fair}', 'Blue', false, true, 21),
('Navy Slim Two-Piece Suit', 'navy-slim-two-piece-suit-51102', 'A slim-fit navy two-piece suit for the working week, with a two-button jacket and tapered trousers.', 'Slim-fit navy suit by Van Heusen', 'FSUIT-51102', 'Van Heusen', '20000000-0000-0000-0000-000000000005', 14999.00, 17999.00, '70% Wool, 30% Polyester, Polyester Lining', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 16, false, '{deep,medium_dark,medium,fair,very_fair}', 'Navy', false, false, NULL),
('Pale Grey Pinstripe Double-Breasted Suit', 'pale-grey-pinstripe-double-breasted-suit-51103', 'A double-breasted suit in pale grey pinstripe Super 120s wool. Full-canvas construction, peak lapels and over 40 hours of handwork go into every piece. Made to measure so the stripes run true.', 'Handcrafted pale grey pinstripe double-breasted suit', 'FSUIT-51103', 'Lux Atelier', '20000000-0000-0000-0000-000000000005', 32999.00, 38999.00, 'Super 120s Wool, Full-Canvas Construction, Bemberg Cupro Lining', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 4, true, '{deep,medium_dark,medium,fair}', 'Grey', true, true, 28),
('Black Shawl-Lapel Tuxedo', 'black-shawl-lapel-tuxedo-51104', 'A black-tie tuxedo in wool barathea with silk satin shawl lapels and a satin trouser stripe, handcrafted in our atelier. Made to measure for weddings and formal evenings.', 'Handcrafted black tuxedo with silk satin lapels', 'FSUIT-51104', 'Lux Atelier', '20000000-0000-0000-0000-000000000005', 34999.00, 41999.00, 'Wool Barathea, Silk Satin Lapels, Silk Lining', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 4, true, '{deep,medium_dark,medium,fair,very_fair}', 'Black', true, true, 28),
('Grey Check Three-Piece Suit', 'grey-check-three-piece-suit-51105', 'A three-piece suit in grey check wool: jacket, waistcoat and trousers, handcrafted with a half-canvas front and hand-sewn buttonholes. Made to measure or in standard sizes.', 'Handcrafted grey check three-piece suit with waistcoat', 'FSUIT-51105', 'Lux Atelier', '20000000-0000-0000-0000-000000000005', 29999.00, 35999.00, '100% Wool Check, Half-Canvas Construction, Viscose Lining', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 5, false, '{deep,medium_dark,medium,fair}', 'Grey', true, true, 28),
('Ivory Linen Waistcoat', 'ivory-linen-waistcoat-51106', 'A five-button waistcoat in ivory linen with an adjustable back strap, cut and finished by hand. Wear it with a matching suit or on its own over a formal shirt.', 'Handcrafted ivory linen waistcoat', 'FSUIT-51106', 'Lux Atelier', '20000000-0000-0000-0000-000000000005', 4999.00, 5999.00, '100% Linen, Cotton Back, Horn Buttons', 'Dry clean only, Hang on a shaped wooden hanger, Steam to refresh, Brush after wear', 14, false, '{deep,medium_dark,medium}', 'Ivory', true, true, 10),
('Camel Wool Overcoat', 'camel-wool-overcoat-52101', 'A single-breasted camel overcoat in wool and cashmere, handcrafted with a hand-padded collar and long, clean lines that sit over a suit. Made to measure or in standard sizes.', 'Handcrafted camel overcoat in wool and cashmere', 'FCOAT-52101', 'Lux Atelier', '20000000-0000-0000-0000-000000000006', 21999.00, 25999.00, '90% Wool, 10% Cashmere, Satin Lining', 'Dry clean only, Hang on a broad-shouldered hanger, Brush with a clothes brush, Store in a breathable garment bag', 7, true, '{deep,medium_dark,medium,fair,very_fair}', 'Camel', true, true, 21),
('Stone Double-Breasted Trench Coat', 'stone-double-breasted-trench-coat-52102', 'A double-breasted trench coat in water-repellent cotton gabardine with a storm flap, belted waist and buckled cuffs. It goes over a suit or with knitwear.', 'Classic stone double-breasted trench coat', 'FCOAT-52102', 'Louis Philippe', '20000000-0000-0000-0000-000000000006', 12999.00, 15599.00, '100% Cotton Gabardine, Water-Repellent Finish, Polyester Lining', 'Dry clean only, Hang on a broad-shouldered hanger, Brush with a clothes brush, Store in a breathable garment bag', 12, false, '{deep,medium_dark,medium,fair,very_fair}', 'Beige', false, false, NULL),
('Ivory Cashmere-Blend Topcoat', 'ivory-cashmere-blend-topcoat-52103', 'An ivory topcoat in a wool and cashmere blend with notch lapels and a silk lining, cut and sewn by hand. Made to measure so it falls cleanly over your tailoring.', 'Handcrafted ivory cashmere-blend topcoat', 'FCOAT-52103', 'Lux Atelier', '20000000-0000-0000-0000-000000000006', 24999.00, 29999.00, '70% Wool, 30% Cashmere, Silk Lining', 'Dry clean only, Hang on a broad-shouldered hanger, Brush with a clothes brush, Store in a breathable garment bag', 5, false, '{deep,medium_dark,medium}', 'Ivory', true, true, 24),
('Grey Herringbone Topcoat', 'grey-herringbone-topcoat-52104', 'A grey herringbone topcoat with a fly front and patch pockets, handcrafted in our atelier. A quiet everyday coat for the office and evenings out.', 'Handcrafted grey herringbone topcoat', 'FCOAT-52104', 'Lux Atelier', '20000000-0000-0000-0000-000000000006', 19999.00, 23999.00, '100% Wool Herringbone, Viscose Lining', 'Dry clean only, Hang on a broad-shouldered hanger, Brush with a clothes brush, Store in a breathable garment bag', 6, false, '{deep,medium_dark,medium,fair,very_fair}', 'Grey', true, true, 21),
('Olive Military Greatcoat', 'olive-military-greatcoat-52105', 'A long double-breasted greatcoat in olive wool with a wide collar and gilt buttons, warm enough for the coldest months.', 'Double-breasted olive greatcoat by Raymond', 'FCOAT-52105', 'Raymond', '20000000-0000-0000-0000-000000000006', 14999.00, 17999.00, '80% Wool, 20% Polyamide, Quilted Lining', 'Dry clean only, Hang on a broad-shouldered hanger, Brush with a clothes brush, Store in a breathable garment bag', 9, false, '{medium_dark,medium,fair,very_fair}', 'Olive', false, false, NULL),
('Black Belted Trench Coat', 'black-belted-trench-coat-52106', 'A black trench coat with a belted waist and epaulettes in water-repellent twill. Sharp over a suit on a wet commute.', 'Black belted trench coat by Blackberrys', 'FCOAT-52106', 'Blackberrys', '20000000-0000-0000-0000-000000000006', 11999.00, 14399.00, 'Polyester Twill, Water-Repellent Finish, Polyester Lining', 'Dry clean only, Hang on a broad-shouldered hanger, Brush with a clothes brush, Store in a breathable garment bag', 14, false, '{deep,medium_dark,medium,fair,very_fair}', 'Black', false, false, NULL);

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1593030942428-a5451dca4b42?w=1200&q=80&auto=format&fit=crop', 'Navy Hopsack Blazer - Main Image', true, 1
FROM products p WHERE p.sku = 'FBLZ-50101';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1622497170185-5d668f816a56?w=1200&q=80&auto=format&fit=crop', 'Grey Check Tweed Blazer - Main Image', true, 1
FROM products p WHERE p.sku = 'FBLZ-50102';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1630173250799-2813d34ed14b?w=1200&q=80&auto=format&fit=crop', 'Charcoal Melange Blazer - Main Image', true, 1
FROM products p WHERE p.sku = 'FBLZ-50103';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1600091166971-7f9faad6c1e2?w=1200&q=80&auto=format&fit=crop', 'Sage Windowpane Blazer - Main Image', true, 1
FROM products p WHERE p.sku = 'FBLZ-50104';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1667284152861-36e03571486a?w=1200&q=80&auto=format&fit=crop', 'Burgundy Velvet Dinner Jacket - Main Image', true, 1
FROM products p WHERE p.sku = 'FBLZ-50105';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=1200&q=80&auto=format&fit=crop', 'Black Notch-Lapel Blazer - Main Image', true, 1
FROM products p WHERE p.sku = 'FBLZ-50106';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?w=1200&q=80&auto=format&fit=crop', 'Royal Blue Two-Piece Suit - Main Image', true, 1
FROM products p WHERE p.sku = 'FSUIT-51101';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1200&q=80&auto=format&fit=crop', 'Navy Slim Two-Piece Suit - Main Image', true, 1
FROM products p WHERE p.sku = 'FSUIT-51102';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?w=1200&q=80&auto=format&fit=crop', 'Pale Grey Pinstripe Double-Breasted Suit - Main Image', true, 1
FROM products p WHERE p.sku = 'FSUIT-51103';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1522968439036-e6338d0ed84f?w=1200&q=80&auto=format&fit=crop', 'Black Shawl-Lapel Tuxedo - Main Image', true, 1
FROM products p WHERE p.sku = 'FSUIT-51104';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1631052066165-9720608b36da?w=1200&q=80&auto=format&fit=crop', 'Grey Check Three-Piece Suit - Main Image', true, 1
FROM products p WHERE p.sku = 'FSUIT-51105';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1728467674282-d2481ad19efa?w=1200&q=80&auto=format&fit=crop', 'Ivory Linen Waistcoat - Main Image', true, 1
FROM products p WHERE p.sku = 'FSUIT-51106';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1619603364904-c0498317e145?w=1200&q=80&auto=format&fit=crop', 'Camel Wool Overcoat - Main Image', true, 1
FROM products p WHERE p.sku = 'FCOAT-52101';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1737508945707-ebdccee97cc5?w=1200&q=80&auto=format&fit=crop', 'Stone Double-Breasted Trench Coat - Main Image', true, 1
FROM products p WHERE p.sku = 'FCOAT-52102';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1638109879135-285a7b8b5924?w=1200&q=80&auto=format&fit=crop', 'Ivory Cashmere-Blend Topcoat - Main Image', true, 1
FROM products p WHERE p.sku = 'FCOAT-52103';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1787045107944-9c4381635d93?w=1200&q=80&auto=format&fit=crop', 'Grey Herringbone Topcoat - Main Image', true, 1
FROM products p WHERE p.sku = 'FCOAT-52104';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1715536369840-9e314f847d78?w=1200&q=80&auto=format&fit=crop', 'Olive Military Greatcoat - Main Image', true, 1
FROM products p WHERE p.sku = 'FCOAT-52105';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1642886513308-d21acc15057d?w=1200&q=80&auto=format&fit=crop', 'Black Belted Trench Coat - Main Image', true, 1
FROM products p WHERE p.sku = 'FCOAT-52106';

-- More shirts, trousers and shoes. Photos: Unsplash (free licence, https://unsplash.com/license).
INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price, materials, care_instructions, inventory_quantity, is_featured, skin_tone_tags, base_colour) VALUES
('Sky Blue Twill Dress Shirt', 'sky-blue-twill-dress-shirt-53101', 'A sky blue dress shirt in soft cotton twill with a cutaway collar and single-button cuffs. Easy to pair with a navy tie and a grey suit for the office.', 'Sky blue cotton twill shirt with a cutaway collar', 'FSHIRT-53101', 'Louis Philippe', '20000000-0000-0000-0000-000000000001', 2499.00, 2999.00, '100% Cotton Twill', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 24, true, '{deep,medium_dark,medium,fair,very_fair}', 'Light Blue'),
('Lilac Oxford Dress Shirt', 'lilac-oxford-dress-shirt-53102', 'A slim-fit lilac shirt in breathable cotton Oxford cloth. Wear it with charcoal trousers and a dark tie.', 'Lilac cotton Oxford shirt, slim fit', 'FSHIRT-53102', 'Van Heusen', '20000000-0000-0000-0000-000000000001', 1999.00, 2399.00, '100% Cotton Oxford', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 20, false, '{deep,medium_dark,medium,fair}', 'Lavender'),
('Maroon Gingham Check Shirt', 'maroon-gingham-check-shirt-53103', 'A maroon gingham check shirt in crisp cotton poplin, smart enough for the office and relaxed enough for the weekend.', 'Maroon and white gingham check shirt', 'FSHIRT-53103', 'Peter England', '20000000-0000-0000-0000-000000000001', 1799.00, 2159.00, '100% Cotton Poplin', 'Machine wash cold, Do not bleach, Tumble dry low, Iron on low heat', 18, false, '{medium_dark,medium,fair,very_fair}', 'Burgundy'),
('Navy Slim-Fit Formal Trousers', 'navy-slim-fit-formal-trousers-54101', 'Navy slim-fit formal trousers with a flat front, belt loops and a touch of stretch for all-day comfort. Pairs with light blue or white shirts.', 'Navy slim-fit trousers with a flat front', 'FTROUSER-54101', 'Raymond', '20000000-0000-0000-0000-000000000002', 2499.00, 2999.00, 'Poly-Viscose Blend, Stretch, Partially Lined', 'Dry clean recommended, Hang to keep the crease, Iron on low heat with a pressing cloth', 22, true, '{deep,medium_dark,medium,fair,very_fair}', 'Navy Blue'),
('Black Pleated Wool Trousers', 'black-pleated-wool-trousers-54102', 'High-rise black wool trousers with single forward pleats, side adjusters and brace buttons. A classic cut for evening wear and formal occasions.', 'Black high-rise pleated trousers with brace buttons', 'FTROUSER-54102', 'Lux Atelier', '20000000-0000-0000-0000-000000000002', 3999.00, 4799.00, '100% Wool, Side Adjusters, Brace Buttons', 'Dry clean recommended, Hang to keep the crease, Iron on low heat with a pressing cloth', 12, false, '{deep,medium_dark,medium,fair,very_fair}', 'Black'),
('Grey Tapered Formal Trousers', 'grey-tapered-formal-trousers-54103', 'Mid-grey formal trousers with a tapered leg and a clean flat front. A versatile pair that works with blazers and knitwear alike.', 'Grey tapered formal trousers', 'FTROUSER-54103', 'Park Avenue', '20000000-0000-0000-0000-000000000002', 2199.00, 2639.00, 'Poly-Viscose Blend, Stretch', 'Dry clean recommended, Hang to keep the crease, Iron on low heat with a pressing cloth', 20, false, '{deep,medium_dark,medium,fair}', 'Grey'),
('Brown Leather Brogues', 'brown-leather-brogues-55101', 'Brown brogues in full-grain leather with punched detailing and a leather sole. They go well with navy, grey and tan tailoring.', 'Brown full-grain leather brogues', 'FSHOE-55101', 'Hush Puppies', '20000000-0000-0000-0000-000000000003', 4999.00, 5999.00, 'Genuine Leather Upper, Leather Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 15, true, '{deep,medium_dark,medium,fair,very_fair}', 'Brown'),
('Black Cap-Toe Oxford Shoes', 'black-cap-toe-oxford-shoes-55102', 'Classic black cap-toe Oxfords with closed lacing and a sleek profile, polished for the boardroom and formal evenings.', 'Black cap-toe Oxfords for business and black tie', 'FSHOE-55102', 'Clarks', '20000000-0000-0000-0000-000000000003', 5499.00, 6599.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 18, false, '{deep,medium_dark,medium,fair,very_fair}', 'Black'),
('Tan Wingtip Derby Shoes', 'tan-wingtip-derby-shoes-55103', 'Tan Derby shoes with wingtip broguing and open lacing, cushioned for comfort. A warm-toned pair for chinos and lighter suits.', 'Tan wingtip Derby shoes', 'FSHOE-55103', 'Bata', '20000000-0000-0000-0000-000000000003', 3999.00, 4799.00, 'Genuine Leather Upper, Rubber Sole', 'Wipe with damp cloth, Use shoe cream for conditioning, Store in dust bag', 16, false, '{deep,medium_dark,medium,fair}', 'Tan');

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1594938291221-94f18cbb5660?w=1200&q=80&auto=format&fit=crop', 'Sky Blue Twill Dress Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-53101';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1598032895455-526c9e347a87?w=1200&q=80&auto=format&fit=crop', 'Lilac Oxford Dress Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-53102';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1642764873654-9eef0467b342?w=1200&q=80&auto=format&fit=crop', 'Maroon Gingham Check Shirt - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHIRT-53103';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1624835567150-0c530a20d8cc?w=1200&q=80&auto=format&fit=crop', 'Navy Slim-Fit Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-54101';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1618001789159-ffffe6f96ef2?w=1200&q=80&auto=format&fit=crop', 'Black Pleated Wool Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-54102';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1622450180332-3da1126f10a4?w=1200&q=80&auto=format&fit=crop', 'Grey Tapered Formal Trousers - Main Image', true, 1
FROM products p WHERE p.sku = 'FTROUSER-54103';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1614253429340-98120bd6d753?w=1200&q=80&auto=format&fit=crop', 'Brown Leather Brogues - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-55101';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1552422554-0d5af0c79fc6?w=1200&q=80&auto=format&fit=crop', 'Black Cap-Toe Oxford Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-55102';
INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, 'https://images.unsplash.com/photo-1603191659812-ee978eeeef76?w=1200&q=80&auto=format&fit=crop', 'Tan Wingtip Derby Shoes - Main Image', true, 1
FROM products p WHERE p.sku = 'FSHOE-55103';

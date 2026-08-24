\c products_db

INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price, inventory_quantity, is_featured)
SELECT 'Ladies Watch', 'ladies-watch', 'Elegant ladies watch with a polished stainless steel case and refined bracelet', 'Elegant ladies timepiece', 'WAT-001', 'LUXE BOUTIQUE', '10000000-0000-0000-0000-000000000002', 499.00, 599.00, 12, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'WAT-001');

SELECT 'Gucci Sunglasses', 'gucci-sunglasses', 'Oversized luxury sunglasses', 'Luxury sunglasses', 'SUN-001', 'Gucci', '10000000-0000-0000-0000-000000000002', 450.00, 550.00, 30, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SUN-001');

INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price, inventory_quantity, is_featured)
SELECT 'Prada Loafers', 'prada-loafers', 'Classic leather loafers', 'Leather loafers', 'SHOES-002', 'Prada', '10000000-0000-0000-0000-000000000005', 850.00, 950.00, 20, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SHOES-002');

INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price, inventory_quantity, is_featured)
SELECT 'Louis Vuitton Keepall', 'lv-keepall', 'Iconic monogram duffle bag', 'Classic travel bag', 'BAG-002', 'Louis Vuitton', '10000000-0000-0000-0000-000000000003', 2100.00, 2200.00, 5, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'BAG-002');

INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price, inventory_quantity, is_featured)
SELECT 'Chanel No 5 Perfume', 'chanel-no5', 'Classic floral fragrance', 'Iconic perfume', 'PERF-001', 'Chanel', '10000000-0000-0000-0000-000000000002', 150.00, 160.00, 50, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PERF-001');

INSERT INTO products (name, slug, description, short_description, sku, brand, category_id, price, compare_price, materials, care_instructions, inventory_quantity, is_featured)
SELECT 'Cartier Love Bracelet', 'cartier-bracelet', 'Iconic Cartier Love bracelet crafted in 18K yellow gold, finished with the signature screw motif and designed as a timeless symbol of enduring love.', '18K yellow gold Cartier Love bracelet', 'BRC-001', 'Cartier', '10000000-0000-0000-0000-000000000002', 7350.00, 7350.00, '18K yellow gold', 'Store in the provided case and polish gently with a soft, lint-free cloth. Avoid contact with chemicals, cosmetics, and abrasive surfaces.', 5, true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'BRC-001');

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order)
SELECT p.id, images.image_url, p.name, true, 1
FROM products p
JOIN (VALUES
	('LEG-001', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567122/boutique/products/923247c7-e534-453c-9c61-f9a9076de4c9.jpg'),
	('COAT-001', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567170/boutique/products/fb1dbafe-19ba-44a4-a342-d38c8ffe8f87.jpg'),
	('BAG-001', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567171/boutique/products/ec1c8320-c5ef-42be-9bcb-62b411c02ced.jpg'),
	('SHOES-001', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567172/boutique/products/cbc8f48c-3c3c-442a-8935-05dd68f53318.jpg'),
	('JWL-001', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567172/boutique/products/f1e52c6d-7c8f-43a6-96d6-c6b18c9c28e7.jpg'),
	('SUN-001', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567173/boutique/products/bcc8fb5e-75ea-4985-94eb-c07686d55476.jpg'),
	('SHOES-002', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567174/boutique/products/d1c309f8-bd81-4664-ad9f-316382f40272.jpg'),
	('BAG-002', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567175/boutique/products/29975dfd-aa09-4f4f-af5e-e6b06be95a81.jpg'),
	('PERF-001', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787589406/channel-number-5.jpg'),
	('WAT-001', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787585185/boutique/products/405dce7e-bed9-4d33-81c2-9a3045d65312.jpg'),
	('BRC-001', 'https://res.cloudinary.com/bhqiin8y/image/upload/v1787567176/boutique/products/743cd0bc-250f-4901-8e5d-072c9dccda9a.jpg')
) AS images(sku, image_url) ON images.sku = p.sku;


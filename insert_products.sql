INSERT INTO products (id, name, slug, description, short_description, sku, brand, category_id, price, compare_price, inventory_quantity, is_featured) VALUES 
(gen_random_uuid(), 'Gucci Sunglasses', 'gucci-sunglasses', 'Oversized luxury sunglasses', 'Luxury sunglasses', 'SUN-001', 'Gucci', '10000000-0000-0000-0000-000000000002', 450.00, 550.00, 30, true), 
(gen_random_uuid(), 'Prada Loafers', 'prada-loafers', 'Classic leather loafers', 'Leather loafers', 'SHOES-002', 'Prada', '10000000-0000-0000-0000-000000000005', 850.00, 950.00, 20, true), 
(gen_random_uuid(), 'Louis Vuitton Keepall', 'lv-keepall', 'Iconic monogram duffle bag', 'Classic travel bag', 'BAG-002', 'Louis Vuitton', '10000000-0000-0000-0000-000000000003', 2100.00, 2200.00, 5, true), 
(gen_random_uuid(), 'Chanel No 5 Perfume', 'chanel-no5', 'Classic floral fragrance', 'Iconic perfume', 'PERF-001', 'Chanel', '10000000-0000-0000-0000-000000000002', 150.00, 160.00, 50, true), 
(gen_random_uuid(), 'Hermes Silk Tie', 'hermes-silk-tie', 'Printed silk twill tie', 'Luxury silk tie', 'TIE-001', 'Hermes', '10000000-0000-0000-0000-000000000002', 220.00, 240.00, 15, true),
(gen_random_uuid(), 'Rolex Submariner Watch', 'rolex-submariner', 'Iconic luxury diving watch with Oystersteel bracelet', 'Luxury diving watch', 'WATCH-001', 'Rolex', '10000000-0000-0000-0000-000000000002', 9500.00, 9500.00, 3, true),
(gen_random_uuid(), 'Cartier Love Bracelet', 'cartier-love', '18K Yellow Gold iconic Love bracelet with screw motif', '18K Gold bracelet', 'JEWEL-001', 'Cartier', '10000000-0000-0000-0000-000000000004', 7350.00, 7350.00, 5, true),
(gen_random_uuid(), 'Burberry Trench Coat', 'burberry-trench', 'Classic double-breasted cotton gabardine trench coat', 'Classic trench coat', 'COAT-001', 'Burberry', '10000000-0000-0000-0000-000000000001', 2490.00, 2490.00, 15, true),
(gen_random_uuid(), 'YSL Leather Wallet', 'ysl-wallet', 'Black quilted leather wallet with gold-tone monogram', 'Leather wallet', 'WALLET-001', 'Yves Saint Laurent', '10000000-0000-0000-0000-000000000002', 650.00, 650.00, 20, true),
(gen_random_uuid(), 'Tom Ford Sunglasses', 'tom-ford-sun', 'Oversized cat-eye tortoiseshell sunglasses', 'Cat-eye sunglasses', 'SUN-002', 'Tom Ford', '10000000-0000-0000-0000-000000000002', 495.00, 495.00, 25, true); 

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) 
SELECT p.id, 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=800&q=80', p.name || ' - Main image', true, 1 
FROM products p 
WHERE p.sku IN ('SUN-001', 'SHOES-002', 'BAG-002', 'PERF-001', 'TIE-001');

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) 
SELECT p.id, '/product-images/rolex-watch.jpg', p.name || ' - Main image', true, 1 
FROM products p 
WHERE p.sku = 'WATCH-001';

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) 
SELECT p.id, '/product-images/cartier-bracelet.jpg', p.name || ' - Main image', true, 1 
FROM products p 
WHERE p.sku = 'JEWEL-001';

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) 
SELECT p.id, '/product-images/trench-coat.jpg', p.name || ' - Main image', true, 1 
FROM products p 
WHERE p.sku = 'COAT-001';

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) 
SELECT p.id, '/product-images/leather-wallet.jpg', p.name || ' - Main image', true, 1 
FROM products p 
WHERE p.sku = 'WALLET-001';

INSERT INTO product_images (product_id, image_url, alt_text, is_primary, sort_order) 
SELECT p.id, '/product-images/sunglasses.jpg', p.name || ' - Main image', true, 1 
FROM products p 
WHERE p.sku = 'SUN-002';

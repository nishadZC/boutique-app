-- Database schema for the Boutique microservices (complete; applied to a fresh database).
-- Keep in sync with boutique-gitops/helm/boutique-app/templates/database/configmap.yml.

-- ============================================================
-- AUTH DB
-- ============================================================
\c auth_db

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    role VARCHAR(50) DEFAULT 'customer',
    -- Set on the bootstrap admin: the first sign-in must choose a new password.
    must_change_password BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users (created_at);

-- The store admin (ADMIN_EMAIL) is created by the auth service on first start from the
-- ADMIN_INITIAL_PASSWORD secret. Grant further admins with database/scripts/grant-admin.sql.

-- ============================================================
-- PRODUCTS DB
-- ============================================================
\c products_db

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255),
    description TEXT,
    short_description TEXT,
    sku VARCHAR(100),
    brand VARCHAR(100),
    category_id UUID REFERENCES categories(id),
    price DECIMAL(10,2) NOT NULL,
    compare_price DECIMAL(10,2),
    materials TEXT,
    care_instructions TEXT,
    inventory_quantity INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    -- Archived products are hidden from the store but kept for order history.
    is_active BOOLEAN NOT NULL DEFAULT true,
    -- Made by hand in the atelier (shown as a badge and a shop collection).
    is_handcrafted BOOLEAN NOT NULL DEFAULT false,
    -- Offered in the customer's own measurements; making_days is the working
    -- days needed to tailor such an order before it ships.
    made_to_measure BOOLEAN NOT NULL DEFAULT false,
    making_days INTEGER CHECK (making_days BETWEEN 1 AND 120),
    skin_tone_tags TEXT[] DEFAULT '{}',
    base_colour VARCHAR(100) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_handcrafted ON products (is_handcrafted) WHERE is_handcrafted;

CREATE TABLE IF NOT EXISTS product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(255),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Every stock change (admin adjustment, sale, refund) with who and why.
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    delta INTEGER NOT NULL,
    resulting_quantity INTEGER NOT NULL,
    reason VARCHAR(50) NOT NULL,
    note TEXT,
    actor VARCHAR(255),
    order_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product ON inventory_adjustments (product_id, created_at DESC);

-- Verified-purchase reviews: one per product per delivered order per customer.
CREATE TABLE IF NOT EXISTS product_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    order_id UUID NOT NULL,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    title VARCHAR(120),
    comment TEXT,
    reviewer_name VARCHAR(120),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (order_id, product_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews (product_id, created_at DESC);

-- ============================================================
-- WISHLIST DB
-- ============================================================
\c wishlist_db

CREATE TABLE IF NOT EXISTS wishlist_items (
    user_id UUID NOT NULL,
    product_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, product_id)
);

-- ============================================================
-- ORDERS DB
-- ============================================================
\c orders_db

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    -- total_amount = subtotal_amount + shipping_amount + tax_amount (priced by the orders service)
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal_amount DECIMAL(10,2),
    shipping_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    -- pending -> confirmed -> packed -> shipped -> out_for_delivery -> delivered | cancelled
    status VARCHAR(50) DEFAULT 'pending',
    shipping_address TEXT,
    -- pending | paid | failed | refunded
    payment_status VARCHAR(50) DEFAULT 'pending',
    razorpay_order_id VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    paid_at TIMESTAMP,
    -- True once the items have been deducted from stock (set on payment).
    stock_committed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders (payment_status);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID,
    quantity INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    size VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);

-- Audit trail shown on the admin order page.
CREATE TABLE IF NOT EXISTS order_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    from_value VARCHAR(50),
    to_value VARCHAR(50),
    note TEXT,
    actor VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events (order_id, created_at);

-- Customer cancellations and return/refund requests, and how an admin resolved them.
CREATE TABLE IF NOT EXISTS order_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    -- cancel (before delivery) | return | refund (after delivery)
    type VARCHAR(20) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    details TEXT,
    -- pending (awaiting admin) | refunded | rejected | closed (cancelled before payment, nothing to refund)
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    resolution_note TEXT,
    refund_id VARCHAR(100),
    resolved_by VARCHAR(255),
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_order_requests_order ON order_requests (order_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_requests_one_open ON order_requests (order_id) WHERE status = 'pending';

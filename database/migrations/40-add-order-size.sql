\c orders_db

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS size VARCHAR(50);

-- Migration: category-wise pricing rules + seller price limits.
-- Safe to run multiple times.
ALTER TABLE pricing_settings
ADD COLUMN IF NOT EXISTS min_seller_price DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS max_seller_price DECIMAL(10, 2);

CREATE TABLE IF NOT EXISTS category_pricing_rules (
    id SERIAL PRIMARY KEY,
    category VARCHAR(100) UNIQUE NOT NULL,
    fee_type VARCHAR(20) NOT NULL DEFAULT 'fixed',
    fee_value DECIMAL(10, 2) NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

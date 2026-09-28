-- Migration: delivery charge on pricing settings + orders breakdown.
-- Safe to run multiple times.
ALTER TABLE pricing_settings
ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10, 2) DEFAULT 40;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS delivery_charge DECIMAL(10, 2) DEFAULT 0;

UPDATE pricing_settings
SET delivery_charge = 40
WHERE delivery_charge IS NULL;

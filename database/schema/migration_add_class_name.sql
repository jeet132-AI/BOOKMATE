-- Migration: add class/exam level to book listings
-- (Class 1-12, NEET, JEE, College, Other).
-- Safe to run multiple times.
ALTER TABLE products
ADD COLUMN IF NOT EXISTS class_name VARCHAR(50);

-- Remap the old "Other Competitive" value to "Other".
UPDATE products
SET class_name = 'Other'
WHERE class_name = 'Other Competitive';

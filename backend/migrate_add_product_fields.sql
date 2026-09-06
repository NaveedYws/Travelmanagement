-- Migration: Add title, duration, rating, and reviews columns to products table
-- Run this on your existing database to update without losing data
-- Command: mysql -u root -p producthub < migrate_add_product_fields.sql

USE producthub;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS title    VARCHAR(255) DEFAULT NULL AFTER name,
  ADD COLUMN IF NOT EXISTS duration VARCHAR(100) DEFAULT NULL AFTER description,
  ADD COLUMN IF NOT EXISTS rating   DECIMAL(3,2) NOT NULL DEFAULT 0.00 AFTER whatsapp,
  ADD COLUMN IF NOT EXISTS reviews  INT          NOT NULL DEFAULT 0    AFTER rating;

-- Verify
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'producthub' AND TABLE_NAME = 'products'
ORDER BY ORDINAL_POSITION;

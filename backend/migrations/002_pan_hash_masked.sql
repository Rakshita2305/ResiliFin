-- Replace pan_number with pan_hash (hashed) and pan_masked (for display)
-- Run: mysql -u root -p resilifin < backend/migrations/002_pan_hash_masked.sql

ALTER TABLE personal_info ADD COLUMN pan_hash VARCHAR(255) NULL;
ALTER TABLE personal_info ADD COLUMN pan_masked VARCHAR(10) NULL;

-- Migrate existing pan_number to masked (plain PAN will be dropped)
UPDATE personal_info SET pan_masked = CONCAT(LEFT(pan_number, 3), 'XX', RIGHT(pan_number, 4)) WHERE pan_number IS NOT NULL AND LENGTH(pan_number) = 10;

ALTER TABLE personal_info DROP COLUMN pan_number;

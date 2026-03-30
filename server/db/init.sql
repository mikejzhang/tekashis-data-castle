-- Takeshi's Data Castle — inventory schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  weirdness_level INTEGER NOT NULL CHECK (weirdness_level BETWEEN 1 AND 10)
);

ALTER TABLE inventory_items
ADD COLUMN IF NOT EXISTS weirdness_level INTEGER;

UPDATE inventory_items
SET weirdness_level = COALESCE(weirdness_level, 5);

ALTER TABLE inventory_items
ALTER COLUMN weirdness_level SET NOT NULL;

ALTER TABLE inventory_items
DROP CONSTRAINT IF EXISTS inventory_items_weirdness_level_check;

ALTER TABLE inventory_items
ADD CONSTRAINT inventory_items_weirdness_level_check
CHECK (weirdness_level BETWEEN 1 AND 10);

DROP INDEX IF EXISTS idx_inventory_weirdness;

ALTER TABLE inventory_items
DROP COLUMN IF EXISTS weirdness_category;

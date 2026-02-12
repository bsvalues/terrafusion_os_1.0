-- Add enable_r_l_s column to all tables that need it
ALTER TABLE mls_systems ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN DEFAULT FALSE;
ALTER TABLE mls_property_mappings ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN DEFAULT FALSE;
ALTER TABLE mls_field_mappings ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN DEFAULT FALSE;
ALTER TABLE public_record_sources ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN DEFAULT FALSE;
ALTER TABLE public_record_mappings ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN DEFAULT FALSE;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN DEFAULT FALSE;
ALTER TABLE mls_comparable_mappings ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN DEFAULT FALSE;
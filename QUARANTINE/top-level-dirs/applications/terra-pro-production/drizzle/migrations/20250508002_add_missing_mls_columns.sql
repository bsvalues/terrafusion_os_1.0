-- Add missing columns to MLS tables

-- Add active column to mls_systems table
ALTER TABLE mls_systems ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- Add enable_r_l_s column to all MLS tables
ALTER TABLE mls_systems ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN;
ALTER TABLE mls_property_mappings ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN;
ALTER TABLE mls_field_mappings ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN;
ALTER TABLE public_record_sources ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN;
ALTER TABLE public_record_mappings ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN;
ALTER TABLE comparable_sales ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN;
ALTER TABLE mls_comparable_mappings ADD COLUMN IF NOT EXISTS enable_r_l_s BOOLEAN;
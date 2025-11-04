-- Create MLS integration tables

-- MLS System Type Enum
DO $$ BEGIN
    CREATE TYPE "mls_system_type" AS ENUM ('rets', 'web_api', 'idx', 'custom');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- MLS Systems
CREATE TABLE IF NOT EXISTS "mls_systems" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "system_type" "mls_system_type" NOT NULL,
    "base_url" text NOT NULL,
    "login_url" text,
    "metadata_url" text,
    "search_url" text,
    "username" text,
    "password" text,
    "user_agent" text,
    "api_key" text,
    "api_version" text,
    "client_id" text,
    "client_secret" text,
    "token_url" text,
    "refresh_token" text,
    "access_token_expires_at" timestamp,
    "region" text,
    "status" text NOT NULL DEFAULT 'inactive',
    "config" json,
    "last_synced_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- MLS Property Mappings
CREATE TABLE IF NOT EXISTS "mls_property_mappings" (
    "id" serial PRIMARY KEY,
    "mls_system_id" integer NOT NULL REFERENCES "mls_systems"("id"),
    "mls_number" varchar(50) NOT NULL,
    "property_id" integer NOT NULL REFERENCES "properties"("id"),
    "mls_status" text,
    "raw_data" json,
    "last_synced" timestamp NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- MLS Field Mappings
CREATE TABLE IF NOT EXISTS "mls_field_mappings" (
    "id" serial PRIMARY KEY,
    "mls_system_id" integer NOT NULL REFERENCES "mls_systems"("id"),
    "mls_field_name" text NOT NULL,
    "app_field_name" text NOT NULL,
    "data_type" text NOT NULL,
    "transformation_rule" text,
    "is_required" boolean DEFAULT false,
    "default_value" text,
    "notes" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Public Record Sources
CREATE TABLE IF NOT EXISTS "public_record_sources" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "source_type" text NOT NULL,
    "base_url" text,
    "api_key" text,
    "username" text,
    "password" text,
    "county_id" text,
    "state" text,
    "config" json,
    "status" text NOT NULL DEFAULT 'inactive',
    "refresh_schedule" text,
    "last_successful_sync" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Public Record Mappings
CREATE TABLE IF NOT EXISTS "public_record_mappings" (
    "id" serial PRIMARY KEY,
    "source_id" integer NOT NULL REFERENCES "public_record_sources"("id"),
    "parcel_id" text NOT NULL,
    "property_id" integer NOT NULL REFERENCES "properties"("id"),
    "raw_data" json,
    "last_synced" timestamp NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Make sure properties table exists
CREATE TABLE IF NOT EXISTS "properties" (
    "id" serial PRIMARY KEY,
    "user_id" integer NOT NULL,
    "address" text NOT NULL,
    "city" text NOT NULL,
    "state" text NOT NULL,
    "zip_code" text NOT NULL,
    "county" text,
    "property_type" text NOT NULL,
    "year_built" integer,
    "square_feet" integer,
    "acreage" real,
    "bedrooms" integer,
    "bathrooms" real,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Make sure comparable_sales table exists
CREATE TABLE IF NOT EXISTS "comparable_sales" (
    "id" serial PRIMARY KEY,
    "property_id" integer REFERENCES "properties"("id"),
    "address" text NOT NULL,
    "city" text NOT NULL,
    "state" text NOT NULL,
    "zip_code" text NOT NULL,
    "county" text NOT NULL,
    "sale_date" timestamp NOT NULL,
    "sale_amount" real NOT NULL,
    "property_type" text NOT NULL,
    "year_built" integer,
    "square_feet" integer,
    "acreage" real,
    "bedrooms" integer,
    "bathrooms" real,
    "distance_to_subject" real,
    "adjusted_sale_amount" real,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- MLS Comparable Mappings
CREATE TABLE IF NOT EXISTS "mls_comparable_mappings" (
    "id" serial PRIMARY KEY,
    "mls_system_id" integer NOT NULL REFERENCES "mls_systems"("id"),
    "mls_number" varchar(50) NOT NULL,
    "comparable_id" integer NOT NULL REFERENCES "comparable_sales"("id"),
    "mls_status" text,
    "raw_data" json,
    "last_synced" timestamp NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- Create indices for faster queries
CREATE INDEX IF NOT EXISTS "mls_property_mappings_mls_system_id_idx" ON "mls_property_mappings" ("mls_system_id");
CREATE INDEX IF NOT EXISTS "mls_property_mappings_property_id_idx" ON "mls_property_mappings" ("property_id");
CREATE INDEX IF NOT EXISTS "mls_property_mappings_mls_number_idx" ON "mls_property_mappings" ("mls_number");

CREATE INDEX IF NOT EXISTS "mls_field_mappings_mls_system_id_idx" ON "mls_field_mappings" ("mls_system_id");

CREATE INDEX IF NOT EXISTS "public_record_mappings_source_id_idx" ON "public_record_mappings" ("source_id");
CREATE INDEX IF NOT EXISTS "public_record_mappings_property_id_idx" ON "public_record_mappings" ("property_id");
CREATE INDEX IF NOT EXISTS "public_record_mappings_parcel_id_idx" ON "public_record_mappings" ("parcel_id");

CREATE INDEX IF NOT EXISTS "mls_comparable_mappings_mls_system_id_idx" ON "mls_comparable_mappings" ("mls_system_id");
CREATE INDEX IF NOT EXISTS "mls_comparable_mappings_comparable_id_idx" ON "mls_comparable_mappings" ("comparable_id");
CREATE INDEX IF NOT EXISTS "mls_comparable_mappings_mls_number_idx" ON "mls_comparable_mappings" ("mls_number");
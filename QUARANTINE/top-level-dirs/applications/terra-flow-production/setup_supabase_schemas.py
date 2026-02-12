#!/usr/bin/env python3
"""
Setup Supabase Schemas

This script sets up the necessary schemas and tables in Supabase for the GeoAssessmentPro application.
It creates tables for properties, assessments, and other related entities using Row Level Security (RLS)
to ensure proper data access controls.
"""

import os
import logging
from typing import Dict, Any, Optional, List

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('setup_supabase_schemas')

try:
    from supabase import create_client, Client
    from postgrest.exceptions import APIError
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.error("❌ Supabase package not installed. Install with: pip install supabase")

def check_env_variables() -> bool:
    """
    Check if Supabase environment variables are set.
    
    Returns:
        True if all required variables are set, False otherwise
    """
    required_vars = ['SUPABASE_URL', 'SUPABASE_KEY', 'SUPABASE_SERVICE_KEY']
    missing_vars = [var for var in required_vars if not os.environ.get(var)]
    
    if missing_vars:
        logger.error(f"Missing environment variables: {', '.join(missing_vars)}")
        logger.info("Make sure you've set up your environment variables correctly.")
        return False
    
    return True

def get_supabase_client() -> Optional[Client]:
    """
    Get a Supabase client instance.
    
    Returns:
        Supabase client or None if not available
    """
    if not SUPABASE_AVAILABLE:
        logger.error("Supabase package is not installed")
        return None
    
    if not check_env_variables():
        return None
    
    try:
        url = os.environ.get('SUPABASE_URL')
        # Use the service key for schema setup to ensure proper permissions
        key = os.environ.get('SUPABASE_SERVICE_KEY')
        
        logger.debug(f"Creating Supabase client for {url}")
        client = create_client(url, key)
        return client
    except Exception as e:
        logger.error(f"Error creating Supabase client: {str(e)}")
        return None

def create_schema(client: Client, schema_name: str) -> bool:
    """
    Create a schema if it doesn't exist.
    
    Args:
        client: Supabase client
        schema_name: Name of the schema to create
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Execute SQL to create schema if it doesn't exist
        query = f"CREATE SCHEMA IF NOT EXISTS {schema_name};"
        client.sql(query).execute()
        logger.info(f"Created schema: {schema_name}")
        return True
    except Exception as e:
        logger.error(f"Error creating schema {schema_name}: {str(e)}")
        return False

def create_extension(client: Client, extension_name: str) -> bool:
    """
    Create or enable a PostgreSQL extension.
    
    Args:
        client: Supabase client
        extension_name: Name of the extension to create
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Execute SQL to create extension if it doesn't exist
        query = f"CREATE EXTENSION IF NOT EXISTS {extension_name};"
        client.sql(query).execute()
        logger.info(f"Enabled extension: {extension_name}")
        return True
    except Exception as e:
        logger.error(f"Error enabling extension {extension_name}: {str(e)}")
        return False

def setup_property_tables(client: Client) -> bool:
    """
    Set up tables related to properties.
    
    Args:
        client: Supabase client
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create properties table in public schema
        properties_sql = """
        CREATE TABLE IF NOT EXISTS public.properties (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            parcel_id TEXT UNIQUE NOT NULL,
            account_number TEXT,
            legal_description TEXT,
            address TEXT,
            city TEXT,
            state TEXT DEFAULT 'WA',
            zip_code TEXT,
            latitude NUMERIC,
            longitude NUMERIC,
            geometry GEOMETRY(GEOMETRY, 4326),
            property_class TEXT,
            zoning TEXT,
            land_area NUMERIC,
            land_value NUMERIC,
            improvement_value NUMERIC,
            total_value NUMERIC,
            year_built INT,
            bedrooms INT,
            bathrooms NUMERIC,
            living_area NUMERIC,
            lot_size NUMERIC,
            owner_name TEXT,
            owner_address TEXT,
            owner_city TEXT,
            owner_state TEXT,
            owner_zip TEXT,
            last_sale_date DATE,
            last_sale_price NUMERIC,
            last_sale_document TEXT,
            status TEXT DEFAULT 'active',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            data JSONB DEFAULT '{}'::jsonb
        );

        -- Create spatial index on geometry column
        CREATE INDEX IF NOT EXISTS properties_geometry_idx ON public.properties USING GIST (geometry);
        
        -- Create index on parcel_id for faster lookups
        CREATE INDEX IF NOT EXISTS properties_parcel_id_idx ON public.properties (parcel_id);
        
        -- Create trigger for updated_at timestamp
        CREATE OR REPLACE FUNCTION update_timestamp()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = now();
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        DROP TRIGGER IF EXISTS properties_updated_at ON public.properties;
        CREATE TRIGGER properties_updated_at
            BEFORE UPDATE ON public.properties
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        """
        client.sql(properties_sql).execute()
        logger.info("Created properties table in public schema")
        
        # Create property schema for dedicated property management
        # This follows our property_model.py schema
        property_schema_sql = """
        -- Create property schema if it doesn't exist
        CREATE SCHEMA IF NOT EXISTS property;
        
        -- Create properties table
        CREATE TABLE IF NOT EXISTS property.properties (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            parcel_id TEXT NOT NULL,
            account_number TEXT,
            address TEXT,
            city TEXT,
            state TEXT,
            zip_code TEXT,
            property_class TEXT,
            zoning TEXT,
            legal_description TEXT,
            land_area NUMERIC,
            lot_size NUMERIC,
            status TEXT DEFAULT 'active',
            owner_name TEXT,
            owner_address TEXT,
            owner_city TEXT,
            owner_state TEXT,
            owner_zip TEXT,
            year_built INTEGER,
            living_area NUMERIC,
            bedrooms INTEGER,
            bathrooms NUMERIC,
            latitude NUMERIC,
            longitude NUMERIC,
            land_value NUMERIC,
            improvement_value NUMERIC,
            total_value NUMERIC,
            last_sale_date DATE,
            last_sale_price NUMERIC,
            last_sale_document TEXT,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create assessments table
        CREATE TABLE IF NOT EXISTS property.property_assessments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            property_id UUID NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
            tax_year INTEGER NOT NULL,
            assessment_date DATE,
            land_value NUMERIC,
            improvement_value NUMERIC,
            total_value NUMERIC,
            exemption_value NUMERIC DEFAULT 0,
            taxable_value NUMERIC,
            assessment_type TEXT,
            assessment_status TEXT DEFAULT 'pending',
            notes TEXT,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create files table
        CREATE TABLE IF NOT EXISTS property.property_files (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            property_id UUID NOT NULL REFERENCES property.properties(id) ON DELETE CASCADE,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            file_type TEXT,
            file_category TEXT,
            description TEXT,
            public_url TEXT,
            created_by UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_properties_parcel_id ON property.properties(parcel_id);
        CREATE INDEX IF NOT EXISTS idx_properties_address ON property.properties(address);
        CREATE INDEX IF NOT EXISTS idx_properties_created_by ON property.properties(created_by);
        CREATE INDEX IF NOT EXISTS idx_properties_property_class ON property.properties(property_class);
        CREATE INDEX IF NOT EXISTS idx_properties_status ON property.properties(status);
        
        CREATE INDEX IF NOT EXISTS idx_property_assessments_property_id ON property.property_assessments(property_id);
        CREATE INDEX IF NOT EXISTS idx_property_assessments_tax_year ON property.property_assessments(tax_year);
        CREATE INDEX IF NOT EXISTS idx_property_assessments_assessment_status ON property.property_assessments(assessment_status);
        
        CREATE INDEX IF NOT EXISTS idx_property_files_property_id ON property.property_files(property_id);
        CREATE INDEX IF NOT EXISTS idx_property_files_file_category ON property.property_files(file_category);
        
        -- Enable RLS
        ALTER TABLE property.properties ENABLE ROW LEVEL SECURITY;
        ALTER TABLE property.property_assessments ENABLE ROW LEVEL SECURITY;
        ALTER TABLE property.property_files ENABLE ROW LEVEL SECURITY;
        
        -- Create policies
        CREATE POLICY IF NOT EXISTS "Allow individual read access" ON property.properties
            FOR SELECT USING (auth.uid() = created_by);
            
        CREATE POLICY IF NOT EXISTS "Allow individual insert access" ON property.properties
            FOR INSERT WITH CHECK (auth.uid() = created_by);
            
        CREATE POLICY IF NOT EXISTS "Allow individual update access" ON property.properties
            FOR UPDATE USING (auth.uid() = created_by);
            
        CREATE POLICY IF NOT EXISTS "Allow individual delete access" ON property.properties
            FOR DELETE USING (auth.uid() = created_by);
        
        -- Assessment policies
        CREATE POLICY IF NOT EXISTS "Allow individual read access" ON property.property_assessments
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT created_by FROM property.properties
                    WHERE id = property_id
                )
            );
            
        CREATE POLICY IF NOT EXISTS "Allow individual insert access" ON property.property_assessments
            FOR INSERT WITH CHECK (
                auth.uid() IN (
                    SELECT created_by FROM property.properties
                    WHERE id = property_id
                )
            );
            
        CREATE POLICY IF NOT EXISTS "Allow individual update access" ON property.property_assessments
            FOR UPDATE USING (
                auth.uid() IN (
                    SELECT created_by FROM property.properties
                    WHERE id = property_id
                )
            );
            
        CREATE POLICY IF NOT EXISTS "Allow individual delete access" ON property.property_assessments
            FOR DELETE USING (
                auth.uid() IN (
                    SELECT created_by FROM property.properties
                    WHERE id = property_id
                )
            );
        
        -- File policies
        CREATE POLICY IF NOT EXISTS "Allow individual read access" ON property.property_files
            FOR SELECT USING (
                auth.uid() IN (
                    SELECT created_by FROM property.properties
                    WHERE id = property_id
                )
            );
            
        CREATE POLICY IF NOT EXISTS "Allow individual insert access" ON property.property_files
            FOR INSERT WITH CHECK (
                auth.uid() IN (
                    SELECT created_by FROM property.properties
                    WHERE id = property_id
                )
            );
            
        CREATE POLICY IF NOT EXISTS "Allow individual delete access" ON property.property_files
            FOR DELETE USING (
                auth.uid() IN (
                    SELECT created_by FROM property.properties
                    WHERE id = property_id
                )
            );
        """
        client.sql(property_schema_sql).execute()
        logger.info("Created property schema and tables for property management")
        
        # Create assessments table
        assessments_sql = """
        CREATE TABLE IF NOT EXISTS public.assessments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
            tax_year INT NOT NULL,
            assessment_date DATE NOT NULL,
            land_value NUMERIC,
            improvement_value NUMERIC,
            total_value NUMERIC,
            exemption_value NUMERIC DEFAULT 0,
            taxable_value NUMERIC,
            assessment_type TEXT,
            assessment_status TEXT DEFAULT 'pending',
            assessor_id UUID,
            notes TEXT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            data JSONB DEFAULT '{}'::jsonb,
            UNIQUE (property_id, tax_year)
        );
        
        -- Create index on property_id for faster lookups
        CREATE INDEX IF NOT EXISTS assessments_property_id_idx ON public.assessments (property_id);
        
        -- Create index on tax_year for filtering
        CREATE INDEX IF NOT EXISTS assessments_tax_year_idx ON public.assessments (tax_year);
        
        -- Create trigger for updated_at timestamp
        DROP TRIGGER IF EXISTS assessments_updated_at ON public.assessments;
        CREATE TRIGGER assessments_updated_at
            BEFORE UPDATE ON public.assessments
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        """
        client.sql(assessments_sql).execute()
        logger.info("Created assessments table")
        
        # Create property_comparables table
        comparables_sql = """
        CREATE TABLE IF NOT EXISTS public.property_comparables (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
            comparable_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
            similarity_score NUMERIC,
            factors JSONB,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            UNIQUE (property_id, comparable_id)
        );
        
        -- Create index on property_id for faster lookups
        CREATE INDEX IF NOT EXISTS property_comparables_property_id_idx ON public.property_comparables (property_id);
        
        -- Create index on comparable_id for relationship lookups
        CREATE INDEX IF NOT EXISTS property_comparables_comparable_id_idx ON public.property_comparables (comparable_id);
        
        -- Create trigger for updated_at timestamp
        DROP TRIGGER IF EXISTS property_comparables_updated_at ON public.property_comparables;
        CREATE TRIGGER property_comparables_updated_at
            BEFORE UPDATE ON public.property_comparables
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        """
        client.sql(comparables_sql).execute()
        logger.info("Created property_comparables table")
        
        # Create property_files table
        files_sql = """
        CREATE TABLE IF NOT EXISTS public.property_files (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
            file_name TEXT NOT NULL,
            file_type TEXT,
            file_size BIGINT,
            storage_path TEXT,
            public_url TEXT,
            file_category TEXT,
            uploaded_by UUID,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            metadata JSONB DEFAULT '{}'::jsonb
        );
        
        -- Create index on property_id for faster lookups
        CREATE INDEX IF NOT EXISTS property_files_property_id_idx ON public.property_files (property_id);
        
        -- Create trigger for updated_at timestamp
        DROP TRIGGER IF EXISTS property_files_updated_at ON public.property_files;
        CREATE TRIGGER property_files_updated_at
            BEFORE UPDATE ON public.property_files
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        """
        client.sql(files_sql).execute()
        logger.info("Created property_files table")
        
        # Create inspection_records table
        inspections_sql = """
        CREATE TABLE IF NOT EXISTS public.inspection_records (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
            inspection_date DATE NOT NULL,
            inspector_id UUID,
            inspection_type TEXT,
            status TEXT DEFAULT 'scheduled',
            findings TEXT,
            images JSONB,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            data JSONB DEFAULT '{}'::jsonb
        );
        
        -- Create index on property_id for faster lookups
        CREATE INDEX IF NOT EXISTS inspection_records_property_id_idx ON public.inspection_records (property_id);
        
        -- Create index on inspection_date for date-based queries
        CREATE INDEX IF NOT EXISTS inspection_records_date_idx ON public.inspection_records (inspection_date);
        
        -- Create trigger for updated_at timestamp
        DROP TRIGGER IF EXISTS inspection_records_updated_at ON public.inspection_records;
        CREATE TRIGGER inspection_records_updated_at
            BEFORE UPDATE ON public.inspection_records
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        """
        client.sql(inspections_sql).execute()
        logger.info("Created inspection_records table")
        
        # Create tax_appeals table
        appeals_sql = """
        CREATE TABLE IF NOT EXISTS public.tax_appeals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
            assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE,
            tax_year INT NOT NULL,
            filed_date DATE,
            hearing_date DATE,
            appellant_name TEXT,
            appellant_contact TEXT,
            appeal_reason TEXT,
            requested_value NUMERIC,
            decision TEXT,
            decision_date DATE,
            final_value NUMERIC,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            documents JSONB DEFAULT '[]'::jsonb,
            notes TEXT
        );
        
        -- Create index on property_id for faster lookups
        CREATE INDEX IF NOT EXISTS tax_appeals_property_id_idx ON public.tax_appeals (property_id);
        
        -- Create index on assessment_id for relationship lookups
        CREATE INDEX IF NOT EXISTS tax_appeals_assessment_id_idx ON public.tax_appeals (assessment_id);
        
        -- Create index on tax_year for filtering
        CREATE INDEX IF NOT EXISTS tax_appeals_tax_year_idx ON public.tax_appeals (tax_year);
        
        -- Create trigger for updated_at timestamp
        DROP TRIGGER IF EXISTS tax_appeals_updated_at ON public.tax_appeals;
        CREATE TRIGGER tax_appeals_updated_at
            BEFORE UPDATE ON public.tax_appeals
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        """
        client.sql(appeals_sql).execute()
        logger.info("Created tax_appeals table")
        
        # Create market_areas table
        market_areas_sql = """
        CREATE TABLE IF NOT EXISTS public.market_areas (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            geometry GEOMETRY(MULTIPOLYGON, 4326),
            factor NUMERIC DEFAULT 1.0,
            tax_year INT,
            created_at TIMESTAMPTZ DEFAULT now(),
            updated_at TIMESTAMPTZ DEFAULT now(),
            metadata JSONB DEFAULT '{}'::jsonb
        );
        
        -- Create spatial index on geometry column
        CREATE INDEX IF NOT EXISTS market_areas_geometry_idx ON public.market_areas USING GIST (geometry);
        
        -- Create trigger for updated_at timestamp
        DROP TRIGGER IF EXISTS market_areas_updated_at ON public.market_areas;
        CREATE TRIGGER market_areas_updated_at
            BEFORE UPDATE ON public.market_areas
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        """
        client.sql(market_areas_sql).execute()
        logger.info("Created market_areas table")
        
        return True
    except Exception as e:
        logger.error(f"Error setting up property tables: {str(e)}")
        return False

def setup_rls_policies(client: Client) -> bool:
    """
    Set up Row Level Security (RLS) policies for the tables.
    
    Args:
        client: Supabase client
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Enable RLS on all tables
        tables = [
            'properties',
            'assessments', 
            'property_comparables',
            'property_files',
            'inspection_records',
            'tax_appeals',
            'market_areas'
        ]
        
        for table in tables:
            # Enable RLS
            client.sql(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY;").execute()
            
            # Create policies for authenticated users
            client.sql(f"""
            -- Allow all authenticated users to view
            CREATE POLICY "{table}_select_policy"
            ON public.{table}
            FOR SELECT
            TO authenticated
            USING (true);
            
            -- Allow users with editor role to insert
            CREATE POLICY "{table}_insert_policy"
            ON public.{table}
            FOR INSERT
            TO authenticated
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM auth.users
                    JOIN public.profiles ON auth.users.id = profiles.id
                    WHERE auth.users.id = auth.uid() 
                    AND (
                        profiles.roles::jsonb ? 'admin' OR
                        profiles.roles::jsonb ? 'editor' OR
                        profiles.roles::jsonb ? 'analyst'
                    )
                )
            );
            
            -- Allow users with editor role to update
            CREATE POLICY "{table}_update_policy"
            ON public.{table}
            FOR UPDATE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM auth.users
                    JOIN public.profiles ON auth.users.id = profiles.id
                    WHERE auth.users.id = auth.uid() 
                    AND (
                        profiles.roles::jsonb ? 'admin' OR
                        profiles.roles::jsonb ? 'editor'
                    )
                )
            );
            
            -- Allow only admin to delete
            CREATE POLICY "{table}_delete_policy"
            ON public.{table}
            FOR DELETE
            TO authenticated
            USING (
                EXISTS (
                    SELECT 1 FROM auth.users
                    JOIN public.profiles ON auth.users.id = profiles.id
                    WHERE auth.users.id = auth.uid() 
                    AND profiles.roles::jsonb ? 'admin'
                )
            );
            """).execute()
        
        logger.info("Set up Row Level Security policies for all tables")
        return True
    except Exception as e:
        logger.error(f"Error setting up RLS policies: {str(e)}")
        return False

def create_property_service_functions(client: Client) -> bool:
    """
    Create SQL functions for property service operations.
    
    Args:
        client: Supabase client
        
    Returns:
        True if successful, False otherwise
    """
    try:
        # Create function to find nearby properties
        nearby_properties_sql = """
        CREATE OR REPLACE FUNCTION public.find_nearby_properties(
            p_latitude NUMERIC,
            p_longitude NUMERIC,
            p_distance_meters NUMERIC DEFAULT 1000,
            p_limit INT DEFAULT 10
        )
        RETURNS TABLE (
            id UUID,
            parcel_id TEXT,
            address TEXT,
            distance_meters NUMERIC,
            latitude NUMERIC,
            longitude NUMERIC,
            property_class TEXT,
            total_value NUMERIC
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                p.id,
                p.parcel_id,
                p.address,
                ST_Distance(
                    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
                    p.geometry::geography
                ) AS distance_meters,
                p.latitude,
                p.longitude,
                p.property_class,
                p.total_value
            FROM 
                public.properties p
            WHERE 
                ST_DWithin(
                    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography,
                    p.geometry::geography,
                    p_distance_meters
                )
            ORDER BY 
                distance_meters ASC
            LIMIT p_limit;
        END;
        $$;
        """
        client.sql(nearby_properties_sql).execute()
        logger.info("Created find_nearby_properties function")
        
        # Create function to find properties by market area
        market_area_properties_sql = """
        CREATE OR REPLACE FUNCTION public.find_properties_in_market_area(
            p_market_area_id UUID,
            p_limit INT DEFAULT 100,
            p_offset INT DEFAULT 0
        )
        RETURNS TABLE (
            id UUID,
            parcel_id TEXT,
            address TEXT,
            latitude NUMERIC,
            longitude NUMERIC,
            property_class TEXT,
            total_value NUMERIC
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
            RETURN QUERY
            SELECT 
                p.id,
                p.parcel_id,
                p.address,
                p.latitude,
                p.longitude,
                p.property_class,
                p.total_value
            FROM 
                public.properties p,
                public.market_areas ma
            WHERE 
                ST_Contains(ma.geometry, p.geometry)
                AND ma.id = p_market_area_id
            LIMIT p_limit
            OFFSET p_offset;
        END;
        $$;
        """
        client.sql(market_area_properties_sql).execute()
        logger.info("Created find_properties_in_market_area function")
        
        # Create function to find comparable properties
        comparable_properties_sql = """
        CREATE OR REPLACE FUNCTION public.find_comparable_properties(
            p_property_id UUID,
            p_max_distance_meters NUMERIC DEFAULT 5000,
            p_year_built_tolerance INT DEFAULT 10,
            p_size_tolerance_percent NUMERIC DEFAULT 20,
            p_limit INT DEFAULT 10
        )
        RETURNS TABLE (
            id UUID,
            parcel_id TEXT,
            address TEXT,
            distance_meters NUMERIC,
            year_built INT,
            living_area NUMERIC,
            bedrooms INT,
            bathrooms NUMERIC,
            land_area NUMERIC,
            total_value NUMERIC,
            similarity_score NUMERIC
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
            p_lat NUMERIC;
            p_lng NUMERIC;
            p_year INT;
            p_area NUMERIC;
            p_beds INT;
            p_baths NUMERIC;
            p_land NUMERIC;
            p_class TEXT;
        BEGIN
            -- Get source property details
            SELECT 
                latitude, longitude, year_built, living_area, 
                bedrooms, bathrooms, land_area, property_class
            INTO 
                p_lat, p_lng, p_year, p_area, 
                p_beds, p_baths, p_land, p_class
            FROM 
                public.properties
            WHERE 
                id = p_property_id;

            -- Find comparable properties
            RETURN QUERY
            WITH 
            nearby_properties AS (
                SELECT 
                    p.id,
                    p.parcel_id,
                    p.address,
                    ST_Distance(
                        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
                        p.geometry::geography
                    ) AS distance_meters,
                    p.year_built,
                    p.living_area,
                    p.bedrooms,
                    p.bathrooms,
                    p.land_area,
                    p.total_value,
                    p.property_class
                FROM 
                    public.properties p
                WHERE 
                    p.id != p_property_id
                    AND p.property_class = p_class
                    AND ST_DWithin(
                        ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography,
                        p.geometry::geography,
                        p_max_distance_meters
                    )
                    -- Year built within tolerance (if both properties have year_built)
                    AND (
                        p_year IS NULL 
                        OR p.year_built IS NULL 
                        OR ABS(p.year_built - p_year) <= p_year_built_tolerance
                    )
                    -- Size within tolerance percentage (if both properties have living_area)
                    AND (
                        p_area IS NULL 
                        OR p.living_area IS NULL 
                        OR (
                            p.living_area BETWEEN 
                            p_area * (1 - p_size_tolerance_percent/100) AND 
                            p_area * (1 + p_size_tolerance_percent/100)
                        )
                    )
            )
            SELECT 
                np.id,
                np.parcel_id,
                np.address,
                np.distance_meters,
                np.year_built,
                np.living_area,
                np.bedrooms,
                np.bathrooms,
                np.land_area,
                np.total_value,
                -- Calculate similarity score (higher is better)
                (
                    -- Distance score (0-30 points, closer is better)
                    (1 - LEAST(np.distance_meters / p_max_distance_meters, 1)) * 30 +
                    
                    -- Year built score (0-15 points)
                    CASE 
                        WHEN p_year IS NULL OR np.year_built IS NULL THEN 7.5
                        ELSE (1 - LEAST(ABS(np.year_built - p_year) / p_year_built_tolerance, 1)) * 15
                    END +
                    
                    -- Size score (0-20 points)
                    CASE 
                        WHEN p_area IS NULL OR np.living_area IS NULL THEN 10
                        ELSE (1 - LEAST(ABS(np.living_area - p_area) / (p_area * p_size_tolerance_percent/100), 1)) * 20
                    END +
                    
                    -- Bedroom score (0-15 points)
                    CASE 
                        WHEN p_beds IS NULL OR np.bedrooms IS NULL THEN 7.5
                        ELSE (1 - LEAST(ABS(np.bedrooms - p_beds) / 2, 1)) * 15
                    END +
                    
                    -- Bathroom score (0-10 points)
                    CASE 
                        WHEN p_baths IS NULL OR np.bathrooms IS NULL THEN 5
                        ELSE (1 - LEAST(ABS(np.bathrooms - p_baths) / 2, 1)) * 10
                    END +
                    
                    -- Land area score (0-10 points)
                    CASE 
                        WHEN p_land IS NULL OR np.land_area IS NULL THEN 5
                        ELSE (1 - LEAST(ABS(np.land_area - p_land) / (p_land * p_size_tolerance_percent/100), 1)) * 10
                    END
                ) AS similarity_score
            FROM 
                nearby_properties np
            ORDER BY 
                similarity_score DESC
            LIMIT p_limit;
        END;
        $$;
        """
        client.sql(comparable_properties_sql).execute()
        logger.info("Created find_comparable_properties function")
        
        return True
    except Exception as e:
        logger.error(f"Error creating property service functions: {str(e)}")
        return False

def setup_schemas() -> bool:
    """
    Main function to set up all schemas and tables.
    
    Returns:
        True if successful, False otherwise
    """
    client = get_supabase_client()
    if not client:
        return False
    
    try:
        # Enable PostGIS extension for geospatial functionality
        if not create_extension(client, "postgis"):
            logger.error("Failed to enable PostGIS extension")
            return False
        
        # Create schemas
        if not create_schema(client, "public"):
            logger.error("Failed to create public schema")
            return False
        
        # Set up tables
        if not setup_property_tables(client):
            logger.error("Failed to set up property tables")
            return False
        
        # Set up RLS policies
        if not setup_rls_policies(client):
            logger.error("Failed to set up RLS policies")
            return False
        
        # Create property service functions
        if not create_property_service_functions(client):
            logger.error("Failed to create property service functions")
            return False
        
        logger.info("✅ Schema setup completed successfully")
        return True
    except Exception as e:
        logger.error(f"Error in schema setup: {str(e)}")
        return False

if __name__ == "__main__":
    import sys
    success = setup_schemas()
    sys.exit(0 if success else 1)
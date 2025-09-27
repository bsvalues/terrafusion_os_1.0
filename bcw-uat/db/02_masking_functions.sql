-- TerraFusion OS UAT Data Masking Functions
-- Benton County Washington - Government-Grade PII Protection
-- Sophisticated masking while preserving analytics and spatial relationships

-- =============================================================================
-- CORE MASKING EXTENSIONS
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- DETERMINISTIC MASKING FUNCTIONS
-- =============================================================================

-- Deterministic email masking (same input = same output)
CREATE OR REPLACE FUNCTION mask_email(v_text text, salt text DEFAULT 'uat-benton-2025') RETURNS text AS $$
DECLARE
    local_part text;
    domain_part text;
    hash_val text;
BEGIN
    IF v_text IS NULL OR v_text = '' THEN
        RETURN v_text;
    END IF;
    
    -- Split email
    local_part := split_part(v_text, '@', 1);
    domain_part := split_part(v_text, '@', 2);
    
    -- Keep first character, hash the rest
    hash_val := encode(digest(local_part || salt, 'sha256'), 'hex');
    
    RETURN substr(local_part, 1, 1) || substr(hash_val, 1, 6) || '@' || 
           CASE 
               WHEN domain_part LIKE '%.gov' THEN 'uat.benton.wa.gov'
               WHEN domain_part LIKE '%.mil' THEN 'uat.example.mil' 
               ELSE 'uat.example.com'
           END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Deterministic name masking
CREATE OR REPLACE FUNCTION mask_name(v_text text, salt text DEFAULT 'uat-benton-2025') RETURNS text AS $$
DECLARE
    words text[];
    masked_words text[];
    word text;
    hash_val text;
BEGIN
    IF v_text IS NULL OR v_text = '' THEN
        RETURN v_text;
    END IF;
    
    -- Split name into words
    words := string_to_array(trim(v_text), ' ');
    
    FOREACH word IN ARRAY words
    LOOP
        IF length(word) > 0 THEN
            hash_val := encode(digest(word || salt, 'sha256'), 'hex');
            -- Keep first character, replace rest with hash-based characters
            masked_words := array_append(masked_words, 
                substr(word, 1, 1) || 
                substr(hash_val, 1, GREATEST(length(word) - 1, 1))
            );
        END IF;
    END LOOP;
    
    RETURN array_to_string(masked_words, ' ');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Phone number masking
CREATE OR REPLACE FUNCTION mask_phone(v_text text) RETURNS text AS $$
BEGIN
    IF v_text IS NULL OR v_text = '' THEN
        RETURN v_text;
    END IF;
    
    -- Return format: (xxx) xxx-1234 (keep last 4 digits)
    RETURN regexp_replace(v_text, '(\d{3})(\d{3})(\d{4})', '(xxx) xxx-\3');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- SSN masking (if any exists)
CREATE OR REPLACE FUNCTION mask_ssn(v_text text) RETURNS text AS $$
BEGIN
    IF v_text IS NULL OR v_text = '' THEN
        RETURN v_text;
    END IF;
    
    -- Return format: xxx-xx-1234 (keep last 4 digits)
    RETURN regexp_replace(v_text, '(\d{3})(\d{2})(\d{4})', 'xxx-xx-\3');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Address masking (preserve street type and general area)
CREATE OR REPLACE FUNCTION mask_address(v_text text, salt text DEFAULT 'uat-benton-2025') RETURNS text AS $$
DECLARE
    parts text[];
    number_part text;
    street_part text;
    hash_val text;
BEGIN
    IF v_text IS NULL OR v_text = '' THEN
        RETURN v_text;
    END IF;
    
    -- Extract number and street
    parts := regexp_split_to_array(v_text, '\s+');
    
    IF array_length(parts, 1) >= 2 THEN
        number_part := parts[1];
        street_part := array_to_string(parts[2:array_length(parts,1)], ' ');
        
        -- Generate consistent fake number
        hash_val := encode(digest(v_text || salt, 'sha256'), 'hex');
        number_part := (('x' || substr(hash_val, 1, 8))::bit(32)::int % 9999 + 1000)::text;
        
        -- Mask street name but keep type (ST, AVE, RD, etc)
        street_part := regexp_replace(street_part, 
            '([A-Za-z]+)(\s+(ST|AVE|RD|LN|DR|CT|PL|WAY|BLVD))', 
            'MASKED\2', 'g');
        
        RETURN number_part || ' ' || street_part;
    END IF;
    
    RETURN 'MASKED ADDRESS';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- GEOSPATIAL MASKING FUNCTIONS
-- =============================================================================

-- Controlled geometric jitter (preserves topology while masking exact coordinates)
CREATE OR REPLACE FUNCTION jitter_point(
    pt geometry, 
    meters float DEFAULT 15,
    salt text DEFAULT 'uat-benton-2025'
) RETURNS geometry AS $$
DECLARE
    hash_val text;
    x_offset float;
    y_offset float;
    degrees_per_meter float := 0.000009;  -- Approximate for latitude ~46° (Benton County)
BEGIN
    IF pt IS NULL OR ST_IsEmpty(pt) THEN
        RETURN pt;
    END IF;
    
    -- Generate deterministic but seemingly random offsets
    hash_val := encode(digest(ST_AsText(pt) || salt, 'sha256'), 'hex');
    
    -- Convert hex to offset values
    x_offset := (('x' || substr(hash_val, 1, 8))::bit(32)::bigint % 2000 - 1000) * degrees_per_meter * meters / 1000.0;
    y_offset := (('x' || substr(hash_val, 9, 8))::bit(32)::bigint % 2000 - 1000) * degrees_per_meter * meters / 1000.0;
    
    -- Apply jitter and snap to grid for consistency
    RETURN ST_SnapToGrid(ST_Translate(pt, x_offset, y_offset), 0.000001);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Polygon jitter (preserves shape and area approximately)
CREATE OR REPLACE FUNCTION jitter_polygon(
    poly geometry, 
    meters float DEFAULT 10,
    salt text DEFAULT 'uat-benton-2025'
) RETURNS geometry AS $$
DECLARE
    centroid geometry;
    jittered_centroid geometry;
    translation_x float;
    translation_y float;
BEGIN
    IF poly IS NULL OR ST_IsEmpty(poly) THEN
        RETURN poly;
    END IF;
    
    -- Get centroid and jitter it
    centroid := ST_Centroid(poly);
    jittered_centroid := jitter_point(centroid, meters, salt);
    
    -- Calculate translation
    translation_x := ST_X(jittered_centroid) - ST_X(centroid);
    translation_y := ST_Y(jittered_centroid) - ST_Y(centroid);
    
    -- Translate entire polygon
    RETURN ST_Translate(poly, translation_x, translation_y);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- FINANCIAL DATA MASKING
-- =============================================================================

-- Property value masking (preserve relative relationships)
CREATE OR REPLACE FUNCTION mask_property_value(
    original_value numeric,
    salt text DEFAULT 'uat-benton-2025'
) RETURNS numeric AS $$
DECLARE
    hash_val text;
    variance_percent float;
    masked_value numeric;
BEGIN
    IF original_value IS NULL OR original_value <= 0 THEN
        RETURN original_value;
    END IF;
    
    -- Generate deterministic variance (-15% to +15%)
    hash_val := encode(digest(original_value::text || salt, 'sha256'), 'hex');
    variance_percent := (('x' || substr(hash_val, 1, 8))::bit(32)::bigint % 3000 - 1500) / 100.0 / 100.0;
    
    -- Apply variance and round to nearest $1000
    masked_value := original_value * (1 + variance_percent);
    
    RETURN round(masked_value / 1000) * 1000;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- JSON DATA MASKING
-- =============================================================================

-- Mask PII in JSON fields (for AI training data, etc.)
CREATE OR REPLACE FUNCTION mask_json_pii(json_data jsonb) RETURNS jsonb AS $$
DECLARE
    result jsonb := json_data;
    key text;
    value text;
BEGIN
    IF json_data IS NULL THEN
        RETURN json_data;
    END IF;
    
    -- Iterate through JSON keys
    FOR key IN SELECT jsonb_object_keys(json_data)
    LOOP
        IF key ILIKE '%email%' THEN
            result := jsonb_set(result, ARRAY[key], 
                to_jsonb(mask_email(json_data->>key)));
        ELSIF key ILIKE '%name%' OR key ILIKE '%owner%' THEN
            result := jsonb_set(result, ARRAY[key], 
                to_jsonb(mask_name(json_data->>key)));
        ELSIF key ILIKE '%phone%' THEN
            result := jsonb_set(result, ARRAY[key], 
                to_jsonb(mask_phone(json_data->>key)));
        ELSIF key ILIKE '%address%' THEN
            result := jsonb_set(result, ARRAY[key], 
                to_jsonb(mask_address(json_data->>key)));
        ELSIF key ILIKE '%ssn%' OR key ILIKE '%social%' THEN
            result := jsonb_set(result, ARRAY[key], 
                to_jsonb(mask_ssn(json_data->>key)));
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- AUDIT TRAIL MASKING
-- =============================================================================

-- Mask sensitive data in audit trails while preserving audit integrity
CREATE OR REPLACE FUNCTION mask_audit_data(audit_data jsonb) RETURNS jsonb AS $$
DECLARE
    result jsonb := audit_data;
BEGIN
    IF audit_data IS NULL THEN
        RETURN audit_data;
    END IF;
    
    -- Mask old_values and new_values while preserving structure
    IF audit_data ? 'old_values' THEN
        result := jsonb_set(result, '{old_values}', 
            mask_json_pii(audit_data->'old_values'));
    END IF;
    
    IF audit_data ? 'new_values' THEN
        result := jsonb_set(result, '{new_values}', 
            mask_json_pii(audit_data->'new_values'));
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =============================================================================
-- VALIDATION FUNCTIONS
-- =============================================================================

-- Verify masking quality
CREATE OR REPLACE FUNCTION validate_masking_quality() RETURNS table(
    test_name text,
    passed boolean,
    details text
) AS $$
BEGIN
    -- Test email masking
    RETURN QUERY SELECT 
        'Email Masking'::text,
        mask_email('john.doe@co.benton.wa.us') != 'john.doe@co.benton.wa.us',
        'Original email should be masked'::text;
    
    -- Test name masking
    RETURN QUERY SELECT 
        'Name Masking'::text,
        mask_name('John Smith') != 'John Smith',
        'Original name should be masked'::text;
        
    -- Test deterministic masking
    RETURN QUERY SELECT 
        'Deterministic Masking'::text,
        mask_email('test@example.com') = mask_email('test@example.com'),
        'Same input should produce same output'::text;
    
    -- Test phone masking
    RETURN QUERY SELECT 
        'Phone Masking'::text,
        mask_phone('(509) 555-1234') LIKE '%(xxx) xxx-1234%',
        'Phone should mask first 6 digits'::text;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MASKING STATISTICS
-- =============================================================================

-- Generate masking statistics for compliance reporting
CREATE OR REPLACE FUNCTION get_masking_statistics() RETURNS table(
    table_name text,
    total_records bigint,
    masked_fields integer,
    masking_completion_percent numeric
) AS $$
BEGIN
    -- This will be populated after actual data masking
    RETURN QUERY SELECT 
        'Placeholder'::text,
        0::bigint,
        0::integer,
        0.0::numeric
    WHERE false;  -- No results until implementation
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SUCCESS CONFIRMATION
-- =============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ TerraFusion OS UAT Data Masking Functions Created';
    RAISE NOTICE '🏛️ Government-grade PII protection enabled';
    RAISE NOTICE '🗺️  Geospatial masking with topology preservation';
    RAISE NOTICE '💰 Financial data masking with relationship preservation';
    RAISE NOTICE '🤖 AI training data sanitization ready';
    RAISE NOTICE '📊 Audit trail masking configured';
    RAISE NOTICE '🔍 Validation functions available';
    
    -- Run validation tests
    RAISE NOTICE '🧪 Running masking validation tests...';
END $$;

-- Run validation
SELECT * FROM validate_masking_quality();
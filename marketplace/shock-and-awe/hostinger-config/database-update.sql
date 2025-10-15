-- ============================================================================
-- TerraFusion Market - Database Update Script
-- For production updates and migrations
-- ============================================================================

-- Check current database version
SELECT setting_value as current_version 
FROM tf_settings 
WHERE setting_key = 'database_version'
LIMIT 1;

-- ============================================================================
-- Version 1.0.1 Updates
-- ============================================================================

-- Add database version tracking if not exists
INSERT IGNORE INTO tf_settings (setting_key, setting_value, setting_type, description, is_public) 
VALUES ('database_version', '1.0.1', 'string', 'Current database schema version', FALSE);

-- Add missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_zip ON tf_properties(zip_code);
CREATE INDEX IF NOT EXISTS idx_assessments_confidence ON tf_assessments(ai_confidence);
CREATE INDEX IF NOT EXISTS idx_demo_utm ON tf_demo_requests(utm_source, utm_medium);

-- ============================================================================
-- Performance Optimizations
-- ============================================================================

-- Optimize table structures for better performance
ALTER TABLE tf_properties ENGINE=InnoDB;
ALTER TABLE tf_assessments ENGINE=InnoDB;
ALTER TABLE tf_tax_levies ENGINE=InnoDB;

-- Add partitioning for large tables (if supported)
-- ALTER TABLE tf_audit_logs PARTITION BY RANGE (YEAR(created_at)) (
--     PARTITION p2024 VALUES LESS THAN (2025),
--     PARTITION p2025 VALUES LESS THAN (2026),
--     PARTITION p2026 VALUES LESS THAN (MAXVALUE)
-- );

-- ============================================================================
-- Data Quality Improvements
-- ============================================================================

-- Update any NULL counties to default
UPDATE tf_properties 
SET county = 'Unknown' 
WHERE county IS NULL OR county = '';

-- Standardize property types
UPDATE tf_properties 
SET property_type = 'residential' 
WHERE property_type IN ('single_family', 'condo', 'townhouse');

-- ============================================================================
-- Security Enhancements
-- ============================================================================

-- Add IP address validation
ALTER TABLE tf_demo_requests 
MODIFY COLUMN ip_address VARCHAR(45) CHECK (
    ip_address REGEXP '^([0-9]{1,3}\.){3}[0-9]{1,3}$' OR
    ip_address REGEXP '^([0-9a-fA-F]{0,4}:){1,7}[0-9a-fA-F]{0,4}$'
);

-- ============================================================================
-- New Features
-- ============================================================================

-- Add property images table
CREATE TABLE IF NOT EXISTS tf_property_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    image_type ENUM('exterior', 'interior', 'aerial', 'street_view') DEFAULT 'exterior',
    caption TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES tf_properties(id) ON DELETE CASCADE,
    INDEX idx_property_id (property_id),
    INDEX idx_image_type (image_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add market trends table
CREATE TABLE IF NOT EXISTS tf_market_trends (
    id INT PRIMARY KEY AUTO_INCREMENT,
    county VARCHAR(100) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    trend_date DATE NOT NULL,
    avg_value DECIMAL(15, 2),
    median_value DECIMAL(15, 2),
    sales_volume INT,
    price_change_percent DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_county_type (county, property_type),
    INDEX idx_trend_date (trend_date),
    UNIQUE KEY uk_county_type_date (county, property_type, trend_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Configuration Updates
-- ============================================================================

-- Update system settings with new features
INSERT INTO tf_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('enable_property_images', 'true', 'boolean', 'Enable property image uploads', FALSE),
('max_images_per_property', '10', 'number', 'Maximum images per property', FALSE),
('enable_market_trends', 'true', 'boolean', 'Enable market trend analysis', TRUE),
('trend_update_frequency', 'daily', 'string', 'Market trend update frequency', FALSE)
ON DUPLICATE KEY UPDATE 
setting_value = VALUES(setting_value),
updated_at = CURRENT_TIMESTAMP;

-- ============================================================================
-- Data Migration
-- ============================================================================

-- Migrate any legacy data if needed
-- This would be customized based on existing data structure

-- ============================================================================
-- Cleanup
-- ============================================================================

-- Remove any temporary or obsolete data
DELETE FROM tf_sessions WHERE last_activity < UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 30 DAY));
DELETE FROM tf_audit_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- ============================================================================
-- Verification
-- ============================================================================

-- Verify update completion
SELECT 
    'Database Update Complete' as status,
    setting_value as new_version
FROM tf_settings 
WHERE setting_key = 'database_version';

-- Show table statistics
SELECT 
    table_name,
    table_rows,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name LIKE 'tf_%'
ORDER BY table_name;
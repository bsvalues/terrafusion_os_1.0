-- ============================================================================
-- TerraFusion Market - Database Setup Script for Hostinger MySQL
-- Production database schema and initial data
-- Compatible with MySQL 5.7+ / MariaDB 10.2+
-- ============================================================================

-- Create database if not exists (may need to be done via Hostinger panel)
-- CREATE DATABASE IF NOT EXISTS terrafusion_market CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE terrafusion_market;

-- ============================================================================
-- Core Tables
-- ============================================================================

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS tf_users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    uuid VARCHAR(36) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    organization VARCHAR(255),
    role ENUM('admin', 'assessor', 'inspector', 'viewer') DEFAULT 'viewer',
    status ENUM('active', 'inactive', 'pending', 'suspended') DEFAULT 'pending',
    email_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_uuid (uuid),
    INDEX idx_role (role),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Properties table for property information
CREATE TABLE IF NOT EXISTS tf_properties (
    id INT PRIMARY KEY AUTO_INCREMENT,
    parcel_id VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    county VARCHAR(100) NOT NULL,
    state VARCHAR(10) NOT NULL DEFAULT 'WA',
    zip_code VARCHAR(20) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    property_type ENUM('residential', 'commercial', 'industrial', 'agricultural', 'mixed') NOT NULL,
    land_area DECIMAL(15, 2), -- in square feet
    building_area DECIMAL(15, 2), -- in square feet
    year_built INT,
    bedrooms INT,
    bathrooms DECIMAL(3, 1),
    stories INT,
    garage_spaces INT,
    basement BOOLEAN DEFAULT FALSE,
    pool BOOLEAN DEFAULT FALSE,
    fireplace BOOLEAN DEFAULT FALSE,
    status ENUM('active', 'inactive', 'pending', 'sold') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_parcel_id (parcel_id),
    INDEX idx_county (county),
    INDEX idx_property_type (property_type),
    INDEX idx_location (latitude, longitude),
    INDEX idx_status (status),
    FULLTEXT idx_address (address)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Assessments table for property valuations
CREATE TABLE IF NOT EXISTS tf_assessments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    property_id INT NOT NULL,
    assessor_id INT NOT NULL,
    assessment_date DATE NOT NULL,
    tax_year INT NOT NULL,
    land_value DECIMAL(15, 2) NOT NULL,
    improvement_value DECIMAL(15, 2) NOT NULL,
    total_value DECIMAL(15, 2) GENERATED ALWAYS AS (land_value + improvement_value) STORED,
    assessed_value DECIMAL(15, 2) NOT NULL,
    market_value DECIMAL(15, 2),
    ai_confidence DECIMAL(5, 2), -- AI confidence percentage
    assessment_method ENUM('manual', 'ai_assisted', 'ai_automated') DEFAULT 'ai_assisted',
    notes TEXT,
    status ENUM('draft', 'pending', 'approved', 'rejected') DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (property_id) REFERENCES tf_properties(id) ON DELETE CASCADE,
    FOREIGN KEY (assessor_id) REFERENCES tf_users(id) ON DELETE RESTRICT,
    
    INDEX idx_property_id (property_id),
    INDEX idx_assessor_id (assessor_id),
    INDEX idx_assessment_date (assessment_date),
    INDEX idx_tax_year (tax_year),
    INDEX idx_status (status),
    INDEX idx_total_value (total_value)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tax levies table
CREATE TABLE IF NOT EXISTS tf_tax_levies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    county VARCHAR(100) NOT NULL,
    tax_year INT NOT NULL,
    levy_code VARCHAR(20) NOT NULL,
    levy_name VARCHAR(255) NOT NULL,
    levy_rate DECIMAL(8, 6) NOT NULL, -- rate per $1000 of assessed value
    levy_type ENUM('county', 'city', 'school', 'fire', 'hospital', 'library', 'port', 'other') NOT NULL,
    effective_date DATE NOT NULL,
    expiration_date DATE,
    status ENUM('active', 'inactive', 'proposed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_county (county),
    INDEX idx_tax_year (tax_year),
    INDEX idx_levy_code (levy_code),
    INDEX idx_levy_type (levy_type),
    INDEX idx_status (status),
    UNIQUE KEY uk_county_year_levy (county, tax_year, levy_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- AI and Analytics Tables
-- ============================================================================

-- AI model performance tracking
CREATE TABLE IF NOT EXISTS tf_ai_models (
    id INT PRIMARY KEY AUTO_INCREMENT,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(20) NOT NULL,
    model_type ENUM('valuation', 'classification', 'prediction', 'optimization') NOT NULL,
    county VARCHAR(100),
    property_type VARCHAR(50),
    accuracy_score DECIMAL(5, 4),
    training_date DATE,
    deployment_date DATE,
    status ENUM('training', 'testing', 'deployed', 'retired') DEFAULT 'training',
    config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_model_name (model_name),
    INDEX idx_status (status),
    INDEX idx_county (county),
    UNIQUE KEY uk_model_version (model_name, model_version)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Demo requests and leads
CREATE TABLE IF NOT EXISTS tf_demo_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    phone VARCHAR(20),
    interest_area VARCHAR(100),
    message TEXT,
    demo_type ENUM('property_assessment', 'full_platform', 'custom') DEFAULT 'property_assessment',
    status ENUM('new', 'contacted', 'scheduled', 'completed', 'qualified', 'closed') DEFAULT 'new',
    source VARCHAR(100) DEFAULT 'website',
    utm_source VARCHAR(100),
    utm_medium VARCHAR(100),
    utm_campaign VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_email (email),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_source (source)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- System Tables
-- ============================================================================

-- Session management
CREATE TABLE IF NOT EXISTS tf_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT NOT NULL,
    last_activity INT NOT NULL,
    
    FOREIGN KEY (user_id) REFERENCES tf_users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_last_activity (last_activity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Audit logs
CREATE TABLE IF NOT EXISTS tf_audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES tf_users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- System settings
CREATE TABLE IF NOT EXISTS tf_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Initial Data Population
-- ============================================================================

-- Insert default system settings
INSERT IGNORE INTO tf_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('site_name', 'TerraFusion Market', 'string', 'Site name', TRUE),
('site_description', 'Government Property Intelligence Platform', 'string', 'Site description', TRUE),
('default_county', 'Benton', 'string', 'Default county for demos', TRUE),
('ai_confidence_threshold', '0.95', 'number', 'Minimum AI confidence for automated assessments', FALSE),
('max_demo_requests_per_day', '100', 'number', 'Maximum demo requests per day', FALSE),
('enable_demo_mode', 'true', 'boolean', 'Enable demo functionality', TRUE),
('maintenance_mode', 'false', 'boolean', 'Site maintenance mode', FALSE),
('api_rate_limit', '100', 'number', 'API requests per minute per IP', FALSE);

-- Insert sample counties and tax levies for Washington State
INSERT IGNORE INTO tf_tax_levies (county, tax_year, levy_code, levy_name, levy_rate, levy_type, effective_date) VALUES
('Benton', 2025, 'COUNTY', 'Benton County General', 2.5230, 'county', '2025-01-01'),
('Benton', 2025, 'SCHOOL', 'Richland School District', 4.2500, 'school', '2025-01-01'),
('Benton', 2025, 'FIRE', 'Benton County Fire District 1', 1.2500, 'fire', '2025-01-01'),
('Yakima', 2025, 'COUNTY', 'Yakima County General', 2.7890, 'county', '2025-01-01'),
('Yakima', 2025, 'SCHOOL', 'Yakima School District', 3.8920, 'school', '2025-01-01'),
('Spokane', 2025, 'COUNTY', 'Spokane County General', 3.1250, 'county', '2025-01-01'),
('Spokane', 2025, 'SCHOOL', 'Spokane Public Schools', 4.5670, 'school', '2025-01-01'),
('Clark', 2025, 'COUNTY', 'Clark County General', 2.9780, 'county', '2025-01-01'),
('Clark', 2025, 'SCHOOL', 'Vancouver School District', 3.7840, 'school', '2025-01-01');

-- Create default admin user (password should be changed after first login)
-- Password: TerraFusion2025! (hashed with bcrypt)
INSERT IGNORE INTO tf_users (uuid, email, password_hash, first_name, last_name, organization, role, status, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'admin@terrafusionmarket.io', '$2a$12$LQv3c1yqBwEHxv9qOjSGOe5X8UyQV8Y5nF1MXZY5vJ6Qz4Q7rGVRe', 'System', 'Administrator', 'TerraFusion Market', 'admin', 'active', TRUE);

-- Insert sample AI models
INSERT IGNORE INTO tf_ai_models (model_name, model_version, model_type, county, property_type, accuracy_score, training_date, deployment_date, status) VALUES
('ResidentialValuationV3', '3.2.1', 'valuation', 'Benton', 'residential', 0.9875, '2025-01-15', '2025-01-20', 'deployed'),
('CommercialClassifierV2', '2.1.0', 'classification', 'All', 'commercial', 0.9654, '2025-01-10', '2025-01-18', 'deployed'),
('PropertyTrendPredictor', '1.5.3', 'prediction', 'All', 'All', 0.9234, '2025-01-12', '2025-01-19', 'deployed');

-- ============================================================================
-- Performance Optimization
-- ============================================================================

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_property_county_type ON tf_properties(county, property_type);
CREATE INDEX IF NOT EXISTS idx_assessment_year_property ON tf_assessments(tax_year, property_id);
CREATE INDEX IF NOT EXISTS idx_levy_county_year_type ON tf_tax_levies(county, tax_year, levy_type);

-- ============================================================================
-- Stored Procedures
-- ============================================================================

DELIMITER //

-- Procedure to calculate total tax for a property
CREATE PROCEDURE IF NOT EXISTS CalculatePropertyTax(
    IN p_property_id INT,
    IN p_tax_year INT,
    OUT p_total_tax DECIMAL(15, 2)
)
BEGIN
    DECLARE v_assessed_value DECIMAL(15, 2);
    DECLARE v_county VARCHAR(100);
    
    -- Get property details
    SELECT a.assessed_value, p.county
    INTO v_assessed_value, v_county
    FROM tf_assessments a
    JOIN tf_properties p ON a.property_id = p.id
    WHERE a.property_id = p_property_id 
    AND a.tax_year = p_tax_year
    AND a.status = 'approved'
    ORDER BY a.created_at DESC
    LIMIT 1;
    
    -- Calculate total tax
    SELECT SUM((v_assessed_value / 1000) * levy_rate)
    INTO p_total_tax
    FROM tf_tax_levies
    WHERE county = v_county
    AND tax_year = p_tax_year
    AND status = 'active';
    
END //

DELIMITER ;

-- ============================================================================
-- Views for Common Queries
-- ============================================================================

-- View for property summary with latest assessment
CREATE OR REPLACE VIEW vw_property_summary AS
SELECT 
    p.id,
    p.parcel_id,
    p.address,
    p.city,
    p.county,
    p.state,
    p.zip_code,
    p.property_type,
    p.land_area,
    p.building_area,
    p.year_built,
    a.assessment_date,
    a.tax_year,
    a.total_value,
    a.assessed_value,
    a.market_value,
    a.ai_confidence,
    a.assessment_method
FROM tf_properties p
LEFT JOIN tf_assessments a ON p.id = a.property_id
WHERE a.id = (
    SELECT id 
    FROM tf_assessments a2 
    WHERE a2.property_id = p.id 
    AND a2.status = 'approved'
    ORDER BY a2.tax_year DESC, a2.created_at DESC 
    LIMIT 1
);

-- ============================================================================
-- Security and Permissions
-- ============================================================================

-- Note: These would be executed with appropriate database user permissions
-- GRANT SELECT, INSERT, UPDATE ON tf_properties TO 'tf_app_user'@'localhost';
-- GRANT SELECT, INSERT, UPDATE ON tf_assessments TO 'tf_app_user'@'localhost';
-- GRANT SELECT ON tf_tax_levies TO 'tf_app_user'@'localhost';
-- GRANT ALL ON tf_demo_requests TO 'tf_app_user'@'localhost';

-- ============================================================================
-- Completion Status
-- ============================================================================

SELECT 
    'TerraFusion Market Database Setup Complete' as status,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = DATABASE() 
AND table_name LIKE 'tf_%';
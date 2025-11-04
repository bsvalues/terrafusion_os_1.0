-- West Coast Expansion Schema (California, Oregon, Nevada)
USE benton_county_assessor;

-- Extend county_implementations table for multi-state expansion
ALTER TABLE county_implementations 
ADD COLUMN region VARCHAR(50) DEFAULT 'Pacific Northwest',
ADD COLUMN market_tier ENUM('tier_1', 'tier_2', 'tier_3') DEFAULT 'tier_2',
ADD COLUMN competitive_landscape TEXT,
ADD COLUMN regulatory_requirements TEXT,
ADD COLUMN integration_complexity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium';

-- Create state-specific configuration table
CREATE TABLE IF NOT EXISTS state_configurations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    state_code VARCHAR(2) NOT NULL UNIQUE,
    state_name VARCHAR(50) NOT NULL,
    regulatory_framework JSON,
    tax_assessment_rules JSON,
    compliance_requirements JSON,
    integration_standards JSON,
    certification_requirements JSON,
    data_privacy_rules JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_state_code (state_code)
);

-- Create competitive analysis table
CREATE TABLE IF NOT EXISTS competitive_analysis (
    id INT PRIMARY KEY AUTO_INCREMENT,
    county_implementation_id INT NOT NULL,
    competitor_name VARCHAR(100),
    market_share DECIMAL(5,2),
    strengths TEXT,
    weaknesses TEXT,
    pricing_model TEXT,
    contract_length INT,
    switching_barriers TEXT,
    competitive_advantage TEXT,
    threat_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (county_implementation_id) REFERENCES county_implementations(id) ON DELETE CASCADE,
    INDEX idx_county_competitor (county_implementation_id, competitor_name)
);

-- Create revenue projections table
CREATE TABLE IF NOT EXISTS revenue_projections (
    id INT PRIMARY KEY AUTO_INCREMENT,
    county_implementation_id INT NOT NULL,
    projection_year INT NOT NULL,
    base_contract_value DECIMAL(12,2),
    maintenance_revenue DECIMAL(12,2),
    expansion_revenue DECIMAL(12,2),
    training_revenue DECIMAL(12,2),
    consulting_revenue DECIMAL(12,2),
    total_projected_revenue DECIMAL(12,2),
    confidence_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    assumptions TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (county_implementation_id) REFERENCES county_implementations(id) ON DELETE CASCADE,
    UNIQUE KEY unique_county_year (county_implementation_id, projection_year),
    INDEX idx_projection_year (projection_year)
);

-- Create market opportunity table
CREATE TABLE IF NOT EXISTS market_opportunities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    state_code VARCHAR(2) NOT NULL,
    county_name VARCHAR(100) NOT NULL,
    opportunity_size ENUM('small', 'medium', 'large', 'mega') NOT NULL,
    population INT,
    total_parcels INT,
    estimated_assessed_value DECIMAL(15,2),
    current_vendor VARCHAR(100),
    contract_expiration_date DATE,
    decision_makers JSON,
    budget_cycle VARCHAR(50),
    estimated_contract_value DECIMAL(10,2),
    probability_score DECIMAL(3,2),
    priority_ranking INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_state_opportunity (state_code, opportunity_size),
    INDEX idx_priority (priority_ranking)
);

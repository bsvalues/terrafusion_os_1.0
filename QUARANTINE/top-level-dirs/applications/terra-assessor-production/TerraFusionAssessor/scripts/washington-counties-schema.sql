-- Washington Counties Expansion Schema
USE benton_county_assessor;

-- Create a table to track county implementations
CREATE TABLE IF NOT EXISTS county_implementations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    county_name VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL DEFAULT 'WA',
    fips_code VARCHAR(5) UNIQUE,
    population INT,
    total_parcels INT,
    total_assessed_value DECIMAL(15,2),
    implementation_status ENUM('planning', 'contract_signed', 'data_migration', 'configuration', 'training', 'testing', 'live', 'maintenance') NOT NULL,
    implementation_progress DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    start_date DATE,
    target_go_live DATE,
    actual_go_live DATE,
    assessor_name VARCHAR(100),
    assessor_email VARCHAR(100),
    assessor_phone VARCHAR(20),
    primary_contact_name VARCHAR(100),
    primary_contact_email VARCHAR(100),
    primary_contact_phone VARCHAR(20),
    contract_value DECIMAL(10,2),
    annual_maintenance DECIMAL(10,2),
    special_requirements TEXT,
    data_migration_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_county_name (county_name),
    INDEX idx_implementation_status (implementation_status),
    INDEX idx_target_go_live (target_go_live)
);

-- Create a table for implementation milestones
CREATE TABLE IF NOT EXISTS implementation_milestones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    county_implementation_id INT NOT NULL,
    milestone_name VARCHAR(100) NOT NULL,
    description TEXT,
    planned_date DATE,
    actual_date DATE,
    status ENUM('pending', 'in_progress', 'completed', 'delayed', 'blocked') NOT NULL DEFAULT 'pending',
    completion_percentage DECIMAL(5,2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (county_implementation_id) REFERENCES county_implementations(id) ON DELETE CASCADE,
    INDEX idx_county_milestone (county_implementation_id, milestone_name),
    INDEX idx_status (status)
);

-- Create a table for county-specific configuration
CREATE TABLE IF NOT EXISTS county_configurations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    county_implementation_id INT NOT NULL,
    tax_year INT NOT NULL,
    assessment_date DATE,
    tax_roll_deadline DATE,
    property_types JSON,
    exemption_types JSON,
    appeal_workflow_config JSON,
    assessment_workflow_config JSON,
    integration_settings JSON,
    branding_settings JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (county_implementation_id) REFERENCES county_implementations(id) ON DELETE CASCADE,
    INDEX idx_county_tax_year (county_implementation_id, tax_year)
);

-- Create a table for implementation team members
CREATE TABLE IF NOT EXISTS implementation_team (
    id INT PRIMARY KEY AUTO_INCREMENT,
    county_implementation_id INT NOT NULL,
    member_name VARCHAR(100) NOT NULL,
    role ENUM('project_manager', 'data_migration_specialist', 'configuration_specialist', 'trainer', 'support_specialist', 'county_liaison') NOT NULL,
    email VARCHAR(100),
    phone VARCHAR(20),
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (county_implementation_id) REFERENCES county_implementations(id) ON DELETE CASCADE,
    INDEX idx_county_role (county_implementation_id, role)
);

-- Create a table for implementation issues and risks
CREATE TABLE IF NOT EXISTS implementation_issues (
    id INT PRIMARY KEY AUTO_INCREMENT,
    county_implementation_id INT NOT NULL,
    issue_type ENUM('data', 'configuration', 'training', 'integration', 'performance', 'security', 'compliance', 'other') NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    reported_date DATE NOT NULL,
    status ENUM('open', 'in_progress', 'resolved', 'closed', 'deferred') NOT NULL DEFAULT 'open',
    resolution TEXT,
    resolved_date DATE,
    assigned_to VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (county_implementation_id) REFERENCES county_implementations(id) ON DELETE CASCADE,
    INDEX idx_county_status (county_implementation_id, status),
    INDEX idx_severity (severity)
);

-- TerraFusion Shock & Awe Database Schema
-- Hostinger MySQL Database Setup

CREATE TABLE IF NOT EXISTS government_entities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_id VARCHAR(100) UNIQUE NOT NULL,
    entity_name VARCHAR(255) NOT NULL,
    entity_type ENUM('County', 'State', 'Federal', 'International') NOT NULL,
    integration_level INT DEFAULT 0,
    consciousness_level INT DEFAULT 0,
    status ENUM('Active', 'Pending', 'Suspended') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS citizen_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    citizen_id VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    consciousness_level INT DEFAULT 0,
    engagement_score INT DEFAULT 0,
    privacy_level ENUM('Basic', 'Standard', 'Enhanced', 'Maximum') DEFAULT 'Standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consciousness_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(5,2) NOT NULL,
    entity_id VARCHAR(100),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_entity_date (entity_id, recorded_at),
    INDEX idx_metric_name (metric_name)
);

CREATE TABLE IF NOT EXISTS citizen_services (
    id INT AUTO_INCREMENT PRIMARY KEY,
    service_id VARCHAR(100) UNIQUE NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_type ENUM('Information', 'Transaction', 'Application', 'Consultation', 'Emergency') NOT NULL,
    citizen_id VARCHAR(100),
    government_entity VARCHAR(100),
    status ENUM('Available', 'In_Progress', 'Completed', 'Suspended') DEFAULT 'Available',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    consciousness_enhanced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_citizen_id (citizen_id),
    INDEX idx_status (status)
);

CREATE TABLE IF NOT EXISTS government_interactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    interaction_id VARCHAR(100) UNIQUE NOT NULL,
    citizen_id VARCHAR(100),
    interaction_type ENUM('Query', 'Request', 'Complaint', 'Suggestion', 'Emergency') NOT NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('Open', 'In_Progress', 'Resolved', 'Closed') DEFAULT 'Open',
    priority ENUM('Low', 'Medium', 'High', 'Critical') DEFAULT 'Medium',
    assigned_department VARCHAR(255),
    ai_enhanced BOOLEAN DEFAULT FALSE,
    consciousness_level INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_citizen_id (citizen_id),
    INDEX idx_status (status)
);
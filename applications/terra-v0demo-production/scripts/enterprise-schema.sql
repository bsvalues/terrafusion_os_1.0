DROP DATABASE IF EXISTS terrafusion_pro;
CREATE DATABASE terrafusion_pro;
USE terrafusion_pro;

CREATE TABLE municipalities (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(50) NOT NULL,
    state_province VARCHAR(50),
    population INT,
    area_km2 DECIMAL(10,2),
    timezone VARCHAR(50),
    contact_email VARCHAR(100),
    subscription_tier ENUM('basic', 'professional', 'enterprise') DEFAULT 'basic',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_subscription (subscription_tier)
);

CREATE TABLE infrastructure_systems (
    id INT PRIMARY KEY AUTO_INCREMENT,
    municipality_id INT NOT NULL,
    system_name VARCHAR(100) NOT NULL,
    system_type ENUM('power', 'water', 'traffic', 'emergency', 'waste', 'communications') NOT NULL,
    status ENUM('operational', 'warning', 'critical', 'maintenance', 'offline') DEFAULT 'operational',
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    capacity_rating DECIMAL(12,2),
    current_load DECIMAL(12,2),
    efficiency_rating DECIMAL(5,2),
    last_maintenance DATE,
    next_maintenance DATE,
    installation_date DATE,
    warranty_expiry DATE,
    vendor VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE CASCADE,
    INDEX idx_municipality_type (municipality_id, system_type),
    INDEX idx_status (status),
    INDEX idx_coordinates (latitude, longitude),
    INDEX idx_maintenance (next_maintenance)
);

CREATE TABLE sensor_data (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    infrastructure_id INT NOT NULL,
    sensor_type VARCHAR(50) NOT NULL,
    measurement_value DECIMAL(15,6) NOT NULL,
    measurement_unit VARCHAR(20) NOT NULL,
    quality_score DECIMAL(3,2) DEFAULT 1.00,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSON,
    FOREIGN KEY (infrastructure_id) REFERENCES infrastructure_systems(id) ON DELETE CASCADE,
    INDEX idx_infrastructure_time (infrastructure_id, timestamp),
    INDEX idx_sensor_type (sensor_type),
    INDEX idx_timestamp (timestamp)
);

CREATE TABLE security_events (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    municipality_id INT NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
    source_ip VARCHAR(45),
    target_system VARCHAR(100),
    description TEXT NOT NULL,
    mitigated BOOLEAN DEFAULT FALSE,
    mitigation_action TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL,
    analyst_id INT,
    FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE CASCADE,
    INDEX idx_municipality_severity (municipality_id, severity),
    INDEX idx_detected_at (detected_at),
    INDEX idx_mitigated (mitigated)
);

CREATE TABLE maintenance_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    infrastructure_id INT NOT NULL,
    maintenance_type ENUM('preventive', 'predictive', 'corrective', 'emergency') NOT NULL,
    scheduled_date DATE NOT NULL,
    estimated_duration_hours INT,
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    description TEXT,
    assigned_team VARCHAR(100),
    status ENUM('scheduled', 'in_progress', 'completed', 'cancelled', 'delayed') DEFAULT 'scheduled',
    actual_start_time TIMESTAMP NULL,
    actual_end_time TIMESTAMP NULL,
    cost_estimate DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (infrastructure_id) REFERENCES infrastructure_systems(id) ON DELETE CASCADE,
    INDEX idx_infrastructure_date (infrastructure_id, scheduled_date),
    INDEX idx_status_priority (status, priority),
    INDEX idx_scheduled_date (scheduled_date)
);

CREATE TABLE system_alerts (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    municipality_id INT NOT NULL,
    infrastructure_id INT,
    alert_type VARCHAR(100) NOT NULL,
    severity ENUM('info', 'warning', 'critical', 'emergency') NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_by INT,
    acknowledged_at TIMESTAMP NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_by INT,
    resolved_at TIMESTAMP NULL,
    auto_resolved BOOLEAN DEFAULT FALSE,
    escalation_level INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE CASCADE,
    FOREIGN KEY (infrastructure_id) REFERENCES infrastructure_systems(id) ON DELETE SET NULL,
    INDEX idx_municipality_severity (municipality_id, severity),
    INDEX idx_acknowledged (acknowledged),
    INDEX idx_resolved (resolved),
    INDEX idx_created_at (created_at)
);

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    municipality_id INT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role ENUM('admin', 'operator', 'analyst', 'viewer', 'emergency') NOT NULL,
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    failed_login_attempts INT DEFAULT 0,
    account_locked_until TIMESTAMP NULL,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_municipality_role (municipality_id, role),
    INDEX idx_is_active (is_active)
);

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    municipality_id INT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(50),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE CASCADE,
    INDEX idx_user_timestamp (user_id, timestamp),
    INDEX idx_municipality_timestamp (municipality_id, timestamp),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
);

CREATE TABLE predictive_analytics (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    infrastructure_id INT NOT NULL,
    prediction_type VARCHAR(100) NOT NULL,
    prediction_date DATE NOT NULL,
    confidence_score DECIMAL(5,4) NOT NULL,
    predicted_value DECIMAL(15,6),
    actual_value DECIMAL(15,6),
    model_version VARCHAR(50),
    input_features JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (infrastructure_id) REFERENCES infrastructure_systems(id) ON DELETE CASCADE,
    INDEX idx_infrastructure_date (infrastructure_id, prediction_date),
    INDEX idx_prediction_type (prediction_type),
    INDEX idx_confidence (confidence_score)
);

SELECT 'Enterprise schema created successfully' as status;

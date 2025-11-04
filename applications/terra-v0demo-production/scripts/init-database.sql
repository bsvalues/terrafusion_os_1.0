-- Initialize TerraFusion database schema
CREATE DATABASE IF NOT EXISTS terrafusion_playground;
USE terrafusion_playground;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Data layers table
CREATE TABLE data_layers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    type ENUM('satellite', 'terrain', 'weather', 'boundaries') NOT NULL,
    source_url VARCHAR(500),
    opacity DECIMAL(3,2) DEFAULT 1.00,
    visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Geospatial data points
CREATE TABLE geo_data_points (
    id INT PRIMARY KEY AUTO_INCREMENT,
    layer_id INT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    value JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (layer_id) REFERENCES data_layers(id) ON DELETE CASCADE,
    INDEX idx_coordinates (latitude, longitude),
    INDEX idx_layer_timestamp (layer_id, timestamp)
);

-- System metrics table
CREATE TABLE system_metrics (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_name VARCHAR(50) NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    metric_value DECIMAL(10, 4) NOT NULL,
    unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_service_time (service_name, recorded_at)
);

-- API usage logs
CREATE TABLE api_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    endpoint VARCHAR(200) NOT NULL,
    method ENUM('GET', 'POST', 'PUT', 'DELETE') NOT NULL,
    response_time_ms INT,
    status_code INT,
    user_id INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_endpoint_time (endpoint, timestamp)
);

SELECT 'Database schema initialized successfully' as status;

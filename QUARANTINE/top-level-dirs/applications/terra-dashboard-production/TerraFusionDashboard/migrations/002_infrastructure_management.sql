-- Infrastructure Management Tables Migration
-- Adds TerraFusion infrastructure management capabilities

-- Infrastructure Assets table
CREATE TABLE IF NOT EXISTS infrastructure_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL,
    location JSONB NOT NULL,
    operational_status TEXT DEFAULT 'operational',
    criticality_score DECIMAL(3,1) DEFAULT 5.0,
    last_inspection TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    maintenance_schedule JSONB DEFAULT '[]',
    dependencies JSONB DEFAULT '[]',
    real_time_metrics JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Threat Assessments table
CREATE TABLE IF NOT EXISTS threat_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    threat_id TEXT UNIQUE NOT NULL,
    asset_id TEXT NOT NULL,
    threat_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    probability DECIMAL(3,2) NOT NULL,
    impact_assessment JSONB NOT NULL,
    mitigation_strategies JSONB DEFAULT '[]',
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    requires_immediate_action BOOLEAN DEFAULT FALSE,
    automated_response_triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulation Requests table
CREATE TABLE IF NOT EXISTS simulation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulation_id TEXT UNIQUE NOT NULL,
    scenario_name TEXT NOT NULL,
    asset_ids JSONB NOT NULL,
    simulation_parameters JSONB NOT NULL,
    duration_hours DECIMAL(5,2) NOT NULL,
    priority INTEGER DEFAULT 5,
    requested_by TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    results JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_asset_id ON infrastructure_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_type ON infrastructure_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_status ON infrastructure_assets(operational_status);
CREATE INDEX IF NOT EXISTS idx_infrastructure_assets_criticality ON infrastructure_assets(criticality_score);

CREATE INDEX IF NOT EXISTS idx_threat_assessments_asset_id ON threat_assessments(asset_id);
CREATE INDEX IF NOT EXISTS idx_threat_assessments_severity ON threat_assessments(severity);
CREATE INDEX IF NOT EXISTS idx_threat_assessments_detected_at ON threat_assessments(detected_at);
CREATE INDEX IF NOT EXISTS idx_threat_assessments_immediate_action ON threat_assessments(requires_immediate_action);

CREATE INDEX IF NOT EXISTS idx_simulation_requests_status ON simulation_requests(status);
CREATE INDEX IF NOT EXISTS idx_simulation_requests_priority ON simulation_requests(priority);
CREATE INDEX IF NOT EXISTS idx_simulation_requests_created_at ON simulation_requests(created_at);

-- Add foreign key constraints
ALTER TABLE threat_assessments 
ADD CONSTRAINT fk_threat_assessments_asset_id 
FOREIGN KEY (asset_id) REFERENCES infrastructure_assets(asset_id) 
ON DELETE CASCADE;

-- Insert sample infrastructure assets for demonstration
INSERT INTO infrastructure_assets (asset_id, name, asset_type, location, operational_status, criticality_score, real_time_metrics) VALUES 
('bridge-001', 'Main Street Bridge', 'transportation', '{"latitude": 40.7128, "longitude": -74.0060}', 'operational', 8.5, '{"structural_integrity": 0.94, "traffic_capacity": 0.73, "maintenance_due": false}'),
('power-grid-001', 'Central Power Station', 'energy_grid', '{"latitude": 40.7589, "longitude": -73.9851}', 'operational', 9.8, '{"power_output": 0.96, "efficiency": 0.88, "temperature": 85}'),
('water-main-001', 'Downtown Water Main', 'water_management', '{"latitude": 40.7505, "longitude": -73.9934}', 'operational', 7.2, '{"pressure": 0.92, "flow_rate": 0.87, "leak_detection": false}'),
('comm-tower-001', 'Emergency Communications Tower', 'communications', '{"latitude": 40.7282, "longitude": -74.0776}', 'operational', 8.0, '{"signal_strength": 0.95, "uptime": 0.999, "coverage": 0.92}'),
('hospital-001', 'Regional Medical Center', 'emergency_services', '{"latitude": 40.7362, "longitude": -73.9904}', 'operational', 9.5, '{"capacity": 0.78, "emergency_ready": true, "backup_power": true}')
ON CONFLICT (asset_id) DO NOTHING;

-- Insert sample threat assessments
INSERT INTO threat_assessments (threat_id, asset_id, threat_type, severity, probability, impact_assessment, mitigation_strategies, requires_immediate_action) VALUES
('threat-001', 'bridge-001', 'structural_degradation', 'moderate', 0.25, '{"downtime_hours": 24, "repair_cost": 150000, "affected_population": 50000}', '["Regular inspection", "Preventive maintenance", "Load monitoring"]', false),
('threat-002', 'power-grid-001', 'equipment_failure', 'high', 0.15, '{"downtime_hours": 6, "repair_cost": 500000, "affected_population": 200000}', '["Backup generators", "Redundant systems", "Predictive maintenance"]', true),
('threat-003', 'water-main-001', 'pipe_burst', 'low', 0.08, '{"downtime_hours": 12, "repair_cost": 75000, "affected_population": 25000}', '["Pressure monitoring", "Pipe replacement program", "Emergency shutoff"]', false)
ON CONFLICT (threat_id) DO NOTHING;

-- Insert sample simulation requests
INSERT INTO simulation_requests (simulation_id, scenario_name, asset_ids, simulation_parameters, duration_hours, priority, requested_by, status) VALUES
('sim-001', 'Hurricane Impact Assessment', '["bridge-001", "power-grid-001", "water-main-001"]', '{"disaster_type": "hurricane", "wind_speed": 120, "rainfall": 15}', 72.0, 8, 'emergency_mgmt', 'queued'),
('sim-002', 'Power Grid Failure Cascade', '["power-grid-001", "hospital-001", "comm-tower-001"]', '{"failure_type": "equipment", "cascade_probability": 0.3}', 24.0, 9, 'utilities_dept', 'queued'),
('sim-003', 'Transportation Network Analysis', '["bridge-001"]', '{"traffic_increase": 1.5, "weather_conditions": "snow"}', 12.0, 5, 'transport_dept', 'completed')
ON CONFLICT (simulation_id) DO NOTHING;
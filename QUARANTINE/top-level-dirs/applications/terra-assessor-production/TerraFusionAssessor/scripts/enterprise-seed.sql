USE terrafusion_pro;

INSERT INTO municipalities (name, country, state_province, population, area_km2, timezone, contact_email, subscription_tier) VALUES
('New York City', 'USA', 'New York', 8336817, 778.2, 'America/New_York', 'admin@nyc.gov', 'enterprise'),
('Toronto', 'Canada', 'Ontario', 2794356, 630.2, 'America/Toronto', 'admin@toronto.ca', 'professional'),
('London', 'UK', 'England', 9648110, 1572.0, 'Europe/London', 'admin@london.gov.uk', 'enterprise'),
('Singapore', 'Singapore', NULL, 5685807, 728.6, 'Asia/Singapore', 'admin@gov.sg', 'enterprise'),
('Sydney', 'Australia', 'New South Wales', 5312163, 12368.0, 'Australia/Sydney', 'admin@sydney.nsw.gov.au', 'professional');

INSERT INTO infrastructure_systems (municipality_id, system_name, system_type, status, latitude, longitude, address, capacity_rating, current_load, efficiency_rating, last_maintenance, next_maintenance, installation_date, vendor, model) VALUES
(1, 'Manhattan Power Grid Alpha', 'power', 'operational', 40.7831, -73.9712, '123 Power Station Ave, Manhattan, NY', 1000.00, 850.50, 94.20, '2024-12-15', '2025-03-15', '2020-05-10', 'PowerTech Industries', 'PT-5000X'),
(1, 'Central Water Treatment Plant', 'water', 'warning', 40.7589, -73.9851, '456 Water Works Blvd, Bronx, NY', 800.00, 780.25, 89.10, '2024-11-20', '2025-01-25', '2018-08-22', 'AquaSystems Corp', 'AS-WTP-800'),
(1, 'Times Square Traffic Hub', 'traffic', 'operational', 40.7505, -73.9934, 'Times Square, Manhattan, NY', 1500.00, 1200.75, 92.30, '2024-12-01', '2025-02-01', '2021-03-15', 'TrafficFlow Solutions', 'TFS-Hub-Pro'),
(1, 'Emergency Response Center', 'emergency', 'operational', 40.7282, -74.0776, '1 Police Plaza, Manhattan, NY', 50.00, 45.20, 98.70, '2024-12-10', '2025-01-10', '2019-11-05', 'EmergencyTech Ltd', 'ET-Command-500'),
(2, 'Toronto Hydro Station 7', 'power', 'operational', 43.6532, -79.3832, '100 King St W, Toronto, ON', 750.00, 620.30, 91.80, '2024-11-30', '2025-02-28', '2019-07-12', 'CanadaPower Systems', 'CPS-750HD'),
(3, 'Thames Water Processing', 'water', 'operational', 51.5074, -0.1278, '200 Thames Embankment, London', 900.00, 720.45, 93.50, '2024-12-05', '2025-03-05', '2017-04-18', 'BritishWater Tech', 'BWT-Thames-900');

INSERT INTO users (municipality_id, username, email, password_hash, first_name, last_name, role, department, phone, two_factor_enabled) VALUES
(1, 'admin_nyc', 'admin@nyc.gov', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMNpkt9Uf/KzO', 'John', 'Smith', 'admin', 'IT Operations', '+1-212-555-0001', TRUE),
(1, 'operator_nyc', 'operator@nyc.gov', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMNpkt9Uf/KzO', 'Sarah', 'Johnson', 'operator', 'Infrastructure', '+1-212-555-0002', TRUE),
(2, 'admin_toronto', 'admin@toronto.ca', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMNpkt9Uf/KzO', 'Michael', 'Chen', 'admin', 'City Operations', '+1-416-555-0001', TRUE),
(3, 'admin_london', 'admin@london.gov.uk', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMNpkt9Uf/KzO', 'Emma', 'Williams', 'admin', 'Smart City Division', '+44-20-7946-0001', TRUE);

INSERT INTO sensor_data (infrastructure_id, sensor_type, measurement_value, measurement_unit, quality_score, timestamp) VALUES
(1, 'voltage', 240.50, 'volts', 0.98, NOW() - INTERVAL 1 MINUTE),
(1, 'current', 850.25, 'amperes', 0.97, NOW() - INTERVAL 1 MINUTE),
(1, 'temperature', 65.30, 'celsius', 0.99, NOW() - INTERVAL 1 MINUTE),
(2, 'flow_rate', 780.45, 'liters_per_minute', 0.95, NOW() - INTERVAL 2 MINUTES),
(2, 'pressure', 45.20, 'psi', 0.96, NOW() - INTERVAL 2 MINUTES),
(2, 'ph_level', 7.20, 'ph', 0.98, NOW() - INTERVAL 2 MINUTES),
(3, 'vehicle_count', 1200.00, 'vehicles_per_hour', 1.00, NOW() - INTERVAL 30 SECONDS),
(3, 'average_speed', 25.50, 'mph', 0.94, NOW() - INTERVAL 30 SECONDS);

INSERT INTO system_alerts (municipality_id, infrastructure_id, alert_type, severity, title, message, acknowledged) VALUES
(1, 2, 'pressure_drop', 'warning', 'Water Pressure Drop Detected', 'Water pressure in Sector 7 has dropped below optimal levels. Immediate attention required.', FALSE),
(1, 3, 'traffic_congestion', 'info', 'Heavy Traffic Detected', 'Unusual traffic patterns detected on Bridge Route 12 during off-peak hours.', TRUE),
(2, 5, 'maintenance_due', 'warning', 'Scheduled Maintenance Overdue', 'Toronto Hydro Station 7 maintenance is 5 days overdue. Please schedule immediately.', FALSE);

INSERT INTO maintenance_schedules (infrastructure_id, maintenance_type, scheduled_date, estimated_duration_hours, priority, description, assigned_team, status) VALUES
(1, 'preventive', '2025-03-15', 8, 'medium', 'Quarterly transformer inspection and cleaning', 'Electrical Team Alpha', 'scheduled'),
(2, 'predictive', '2025-01-25', 12, 'high', 'Water pump replacement based on predictive analytics', 'Water Systems Team', 'scheduled'),
(3, 'preventive', '2025-02-01', 4, 'low', 'Traffic signal calibration and software update', 'Traffic Control Team', 'scheduled');

INSERT INTO security_events (municipality_id, event_type, severity, source_ip, target_system, description, mitigated) VALUES
(1, 'unauthorized_access_attempt', 'medium', '192.168.1.100', 'water_control_system', 'Multiple failed login attempts detected from external IP address', TRUE),
(1, 'suspicious_network_traffic', 'low', '10.0.0.45', 'traffic_monitoring', 'Unusual data transfer pattern detected in traffic monitoring network', FALSE),
(2, 'malware_detection', 'high', '172.16.0.23', 'power_grid_control', 'Potential malware signature detected in power grid control system', TRUE);

INSERT INTO predictive_analytics (infrastructure_id, prediction_type, prediction_date, confidence_score, predicted_value, model_version, input_features) VALUES
(2, 'pump_failure_probability', '2025-01-25', 0.8750, 0.85, 'v2.1.0', '{"vibration": 2.3, "temperature": 68.5, "runtime_hours": 8760}'),
(1, 'load_forecast', '2025-01-15', 0.9200, 920.50, 'v1.8.2', '{"historical_load": [850, 870, 890], "weather_temp": 32, "day_of_week": 1}'),
(3, 'traffic_congestion', '2025-01-12', 0.7800, 1450.00, 'v3.0.1', '{"current_flow": 1200, "weather": "clear", "events": []}');

SELECT 'Enterprise data seeded successfully' as status;

-- Seed initial data for TerraFusion Playground
USE terrafusion_playground;

-- Insert sample users
INSERT INTO users (username, email) VALUES
('admin', 'admin@terrafusion.com'),
('analyst1', 'analyst1@terrafusion.com'),
('viewer1', 'viewer1@terrafusion.com');

-- Insert data layers
INSERT INTO data_layers (name, type, source_url, opacity, visible) VALUES
('Global Satellite Imagery', 'satellite', 'https://api.terrafusion.com/satellite', 0.85, TRUE),
('Terrain Elevation', 'terrain', 'https://api.terrafusion.com/terrain', 0.70, FALSE),
('Weather Patterns', 'weather', 'https://api.terrafusion.com/weather', 0.60, TRUE),
('Political Boundaries', 'boundaries', 'https://api.terrafusion.com/boundaries', 0.90, FALSE);

-- Insert sample geospatial data points
INSERT INTO geo_data_points (layer_id, latitude, longitude, value) VALUES
(1, 37.7749, -122.4194, '{"temperature": 18.5, "humidity": 65}'),
(1, 40.7128, -74.0060, '{"temperature": 22.1, "humidity": 58}'),
(1, 51.5074, -0.1278, '{"temperature": 15.3, "humidity": 72}'),
(2, 37.7749, -122.4194, '{"elevation": 52}'),
(2, 40.7128, -74.0060, '{"elevation": 10}'),
(3, 37.7749, -122.4194, '{"wind_speed": 12.5, "precipitation": 0.2}'),
(3, 40.7128, -74.0060, '{"wind_speed": 8.3, "precipitation": 0.0}');

-- Insert system metrics
INSERT INTO system_metrics (service_name, metric_name, metric_value, unit) VALUES
('mcp-server', 'cpu_usage', 45.2, 'percent'),
('mcp-server', 'memory_usage', 67.8, 'percent'),
('prometheus', 'cpu_usage', 32.1, 'percent'),
('prometheus', 'memory_usage', 45.3, 'percent'),
('grafana', 'cpu_usage', 28.7, 'percent'),
('grafana', 'memory_usage', 38.9, 'percent'),
('client-apps', 'response_time', 145.0, 'ms'),
('client-apps', 'active_connections', 1247.0, 'count');

-- Insert API usage logs
INSERT INTO api_logs (endpoint, method, response_time_ms, status_code, user_id) VALUES
('/api/layers', 'GET', 120, 200, 1),
('/api/data-points', 'GET', 85, 200, 2),
('/api/metrics', 'GET', 95, 200, 1),
('/api/layers', 'POST', 180, 201, 1),
('/api/export', 'GET', 450, 200, 3);

SELECT 'Sample data seeded successfully' as status;

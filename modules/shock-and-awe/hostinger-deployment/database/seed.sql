-- TerraFusion Shock & Awe Seed Data
-- Initial data for demonstration

INSERT INTO government_entities (entity_id, entity_name, entity_type, integration_level, consciousness_level, status) VALUES
('BENTON_COUNTY', 'Benton County, Washington', 'County', 97, 94, 'Active'),
('WASHINGTON_STATE', 'Washington State', 'State', 85, 87, 'Active'),
('US_FEDERAL', 'United States Federal Government', 'Federal', 23, 78, 'Pending');

INSERT INTO citizen_profiles (citizen_id, name, email, consciousness_level, engagement_score, privacy_level) VALUES
('citizen_demo_001', 'Sarah Thompson', 'sarah.demo@terrafusion.gov', 76, 89, 'Standard'),
('citizen_demo_002', 'Michael Chen', 'michael.demo@terrafusion.gov', 82, 91, 'Enhanced'),
('citizen_demo_003', 'Jessica Rodriguez', 'jessica.demo@terrafusion.gov', 69, 85, 'Standard');

INSERT INTO consciousness_metrics (metric_name, metric_value, entity_id) VALUES
('Global Consciousness', 87.30, 'GLOBAL'),
('Quantum Coherence', 94.70, 'GLOBAL'),
('Neural Connectivity', 89.30, 'GLOBAL'),
('Temporal Stability', 92.60, 'GLOBAL'),
('Ethical Alignment', 96.80, 'GLOBAL'),
('Transcendence Progress', 84.20, 'GLOBAL'),
('Integration Level', 97.00, 'BENTON_COUNTY'),
('Integration Level', 85.00, 'WASHINGTON_STATE'),
('Integration Level', 23.00, 'US_FEDERAL');

INSERT INTO citizen_services (service_id, service_name, service_type, citizen_id, government_entity, status, priority, consciousness_enhanced) VALUES
('service_001', 'Property Tax Assessment Review', 'Application', 'citizen_demo_001', 'BENTON_COUNTY', 'In_Progress', 'Medium', TRUE),
('service_002', 'Business License Renewal', 'Transaction', 'citizen_demo_002', 'WASHINGTON_STATE', 'Available', 'High', TRUE),
('service_003', 'Voting Registration', 'Application', 'citizen_demo_003', 'BENTON_COUNTY', 'Completed', 'Medium', FALSE);

INSERT INTO government_interactions (interaction_id, citizen_id, interaction_type, subject, description, status, priority, assigned_department, ai_enhanced, consciousness_level) VALUES
('int_001', 'citizen_demo_001', 'Query', 'Property Assessment Question', 'Question about recent property tax assessment increase', 'Resolved', 'Medium', 'Assessor Office', TRUE, 78),
('int_002', 'citizen_demo_002', 'Request', 'Street Light Repair', 'Street light out on Main St near 3rd Ave', 'In_Progress', 'Low', 'Public Works', TRUE, 82),
('int_003', 'citizen_demo_003', 'Suggestion', 'Park Improvement Ideas', 'Suggestions for improving community park facilities', 'Open', 'Low', 'Parks and Recreation', FALSE, 65);
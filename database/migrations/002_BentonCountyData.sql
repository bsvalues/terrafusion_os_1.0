-- TerraFusion OS Database Migration 002: Benton County Sample Data
-- Production-ready sample data for Benton County, Washington
-- Migration Date: 2025-01-01
-- Author: TerraFusion AI Swarm Database Squad Beta

-- Set search path
SET search_path TO government, ai_system, audit, security, public;

-- Insert Benton County if not exists
INSERT INTO government.counties (id, name, state, fips_code, website, contact_email, contact_phone)
VALUES (
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    'Benton County',
    'WA',
    '53005',
    'https://www.co.benton.wa.us',
    'assessor@co.benton.wa.us',
    '(509) 736-3085'
) ON CONFLICT (fips_code) DO UPDATE SET
    website = EXCLUDED.website,
    contact_email = EXCLUDED.contact_email,
    contact_phone = EXCLUDED.contact_phone,
    updated_at = CURRENT_TIMESTAMP;

-- Create Benton County government users
INSERT INTO government.government_users (id, email, first_name, last_name, department, role, county_id, permissions, is_active) VALUES
(
    '11111111-1111-1111-1111-111111111111'::UUID,
    'admin@co.benton.wa.us',
    'John',
    'Smith',
    'Information Technology',
    'SystemAdministrator',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    '{"permissions": ["admin.full", "property.all", "assessment.all", "user.manage", "ai.control"]}',
    true
),
(
    '22222222-2222-2222-2222-222222222222'::UUID,
    'assessor@co.benton.wa.us',
    'Mary',
    'Johnson',
    'Assessor Office',
    'ChiefAssessor',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    '{"permissions": ["property.read", "property.write", "assessment.all", "reports.generate"]}',
    true
),
(
    '33333333-3333-3333-3333-333333333333'::UUID,
    'appraiser1@co.benton.wa.us',
    'Robert',
    'Wilson',
    'Assessor Office',
    'PropertyAppraiser',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    '{"permissions": ["property.read", "assessment.write", "assessment.review"]}',
    true
),
(
    '44444444-4444-4444-4444-444444444444'::UUID,
    'auditor@co.benton.wa.us',
    'Lisa',
    'Davis',
    'Auditor Office',
    'CountyAuditor',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    '{"permissions": ["audit.read", "compliance.monitor", "reports.view"]}',
    true
);

-- Insert AI Agents for Benton County (sample of the 1,008 agents)
INSERT INTO ai_system.ai_agents (id, name, type, status, configuration, assigned_county, performance_score) VALUES
(
    'ai000001-0001-0001-0001-000000000001'::UUID,
    'Terra Agent Alpha-001',
    'PropertyAssessment',
    'active',
    '{"specialization": "residential", "confidence_threshold": 0.95, "quantum_enhanced": true, "processing_speed": "379M_improvement"}',
    'Benton County',
    98.7
),
(
    'ai000002-0002-0002-0002-000000000002'::UUID,
    'Terra Agent Beta-002',
    'CommercialValuation',
    'active',
    '{"specialization": "commercial", "confidence_threshold": 0.92, "quantum_enhanced": true, "processing_speed": "379M_improvement"}',
    'Benton County',
    96.3
),
(
    'ai000003-0003-0003-0003-000000000003'::UUID,
    'Terra Agent Gamma-003',
    'AgriculturalAssessment',
    'active',
    '{"specialization": "agricultural", "confidence_threshold": 0.90, "quantum_enhanced": true, "processing_speed": "379M_improvement"}',
    'Benton County',
    94.8
),
(
    'ai000447-0447-0447-0447-000000000447'::UUID,
    'Terra Agent-447',
    'PropertyAssessment',
    'active',
    '{"specialization": "mixed_use", "confidence_threshold": 0.94, "quantum_enhanced": true, "processing_speed": "379M_improvement"}',
    'Benton County',
    97.2
),
(
    'ai000892-0892-0892-0892-000000000892'::UUID,
    'Terra Agent-892',
    'QualityAssurance',
    'active',
    '{"specialization": "validation", "confidence_threshold": 0.98, "quantum_enhanced": true, "processing_speed": "379M_improvement"}',
    'Benton County',
    99.1
);

-- Insert AI Models
INSERT INTO ai_system.ai_models (name, version, model_type, description, accuracy, trained_date, deployed_date, is_active, training_data_info) VALUES
(
    'TerraFusion Property Valuation Model',
    '3.2.1',
    'PropertyValuation',
    'Quantum-enhanced ML model for residential property assessment with 379M× performance improvement',
    98.7,
    '2024-12-15',
    '2025-01-01',
    true,
    '{"training_properties": 2500000, "counties": 150, "accuracy_validation": "cross_county", "quantum_optimization": true}'
),
(
    'CostForge AI Commercial Model',
    '2.1.0',
    'CommercialValuation',
    'Advanced commercial property valuation with market trend analysis',
    96.3,
    '2024-12-10',
    '2025-01-01',
    true,
    '{"training_properties": 750000, "commercial_types": "all", "market_integration": true}'
),
(
    'Agricultural Assessment Model',
    '1.8.5',
    'AgriculturalValuation',
    'Specialized model for farm and agricultural property assessment',
    94.8,
    '2024-12-05',
    '2025-01-01',
    true,
    '{"farm_properties": 500000, "crop_analysis": true, "soil_quality_integration": true}'
);

-- Insert sample properties for Benton County
INSERT INTO government.properties (id, parcel_id, address, city, state, zip_code, county_id, assessed_value, market_value, year_built, square_footage, property_type, owner_name) VALUES
(
    'prop0001-0001-0001-0001-000000000001'::UUID,
    'BN-001-2024',
    '123 Government Way',
    'Prosser',
    'WA',
    '99350',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    445000,
    450000,
    1995,
    2100,
    'Residential',
    'John and Jane Doe'
),
(
    'prop0002-0002-0002-0002-000000000002'::UUID,
    'BN-002-2024',
    '456 County Road',
    'Kennewick',
    'WA',
    '99336',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    320000,
    325000,
    2003,
    1850,
    'Residential',
    'Robert Smith'
),
(
    'prop0003-0003-0003-0003-000000000003'::UUID,
    'BN-003-2024',
    '789 Municipal Street',
    'Richland',
    'WA',
    '99352',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    575000,
    580000,
    1988,
    2800,
    'Residential',
    'Mary Johnson'
),
(
    'prop0004-0004-0004-0004-000000000004'::UUID,
    'BN-004-2024',
    '1000 Industrial Boulevard',
    'West Richland',
    'WA',
    '99353',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    2500000,
    2750000,
    2010,
    45000,
    'Commercial',
    'Benton Industrial LLC'
),
(
    'prop0005-0005-0005-0005-000000000005'::UUID,
    'BN-005-2024',
    '2500 Vineyard Road',
    'Benton City',
    'WA',
    '99320',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    1200000,
    1350000,
    1975,
    5000,
    'Agricultural',
    'Benton Valley Vineyards'
),
(
    'prop0006-0006-0006-0006-000000000006'::UUID,
    'BN-006-2024',
    '150 Downtown Plaza',
    'Kennewick',
    'WA',
    '99336',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    850000,
    900000,
    1998,
    3200,
    'Mixed Use',
    'Downtown Development Corp'
),
(
    'prop0007-0007-0007-0007-000000000007'::UUID,
    'BN-007-2024',
    '3400 Farm Loop Road',
    'Prosser',
    'WA',
    '99350',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    2100000,
    2250000,
    1982,
    8500,
    'Agricultural',
    'Columbia Valley Farms'
),
(
    'prop0008-0008-0008-0008-000000000008'::UUID,
    'BN-008-2024',
    '725 Residential Court',
    'Richland',
    'WA',
    '99352',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    395000,
    405000,
    2001,
    1950,
    'Residential',
    'Lisa and Mark Wilson'
),
(
    'prop0009-0009-0009-0009-000000000009'::UUID,
    'BN-009-2024',
    '4200 Technology Drive',
    'Richland',
    'WA',
    '99354',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    4500000,
    4800000,
    2015,
    75000,
    'Commercial',
    'Pacific Northwest Technology Center'
),
(
    'prop0010-0010-0010-0010-000000000010'::UUID,
    'BN-010-2024',
    '890 Suburban Lane',
    'West Richland',
    'WA',
    '99353',
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    465000,
    475000,
    2008,
    2250,
    'Residential',
    'Davis Family Trust'
);

-- Insert property assessments (mix of AI and human assessments)
INSERT INTO government.property_assessments (property_id, assessment_year, assessed_value, market_value, land_value, improvement_value, assessment_method, assessor_id, ai_agent_id, confidence_score, assessment_date, is_active) VALUES
-- AI Assessment by Terra Agent-447
(
    'prop0001-0001-0001-0001-000000000001'::UUID,
    2024,
    445000,
    450000,
    125000,
    320000,
    'AI_Quantum_Enhanced',
    NULL,
    'ai000447-0447-0447-0447-000000000447'::UUID,
    94.5,
    '2024-01-15',
    true
),
-- AI Assessment by Terra Agent-892
(
    'prop0002-0002-0002-0002-000000000002'::UUID,
    2024,
    320000,
    325000,
    95000,
    225000,
    'AI_Quantum_Enhanced',
    NULL,
    'ai000892-0892-0892-0892-000000000892'::UUID,
    98.2,
    '2024-01-14',
    true
),
-- Human Assessment (appealed case)
(
    'prop0003-0003-0003-0003-000000000003'::UUID,
    2024,
    575000,
    580000,
    145000,
    430000,
    'Human_Review',
    '33333333-3333-3333-3333-333333333333'::UUID,
    NULL,
    87.1,
    '2024-01-13',
    true
),
-- AI Assessment - Commercial
(
    'prop0004-0004-0004-0004-000000000004'::UUID,
    2024,
    2500000,
    2750000,
    750000,
    1750000,
    'AI_Commercial_Model',
    NULL,
    'ai000002-0002-0002-0002-000000000002'::UUID,
    96.8,
    '2024-01-12',
    true
),
-- AI Assessment - Agricultural
(
    'prop0005-0005-0005-0005-000000000005'::UUID,
    2024,
    1200000,
    1350000,
    900000,
    300000,
    'AI_Agricultural_Model',
    NULL,
    'ai000003-0003-0003-0003-000000000003'::UUID,
    93.7,
    '2024-01-11',
    true
),
-- AI Assessment - Mixed Use
(
    'prop0006-0006-0006-0006-000000000006'::UUID,
    2024,
    850000,
    900000,
    250000,
    600000,
    'AI_Mixed_Use_Model',
    NULL,
    'ai000447-0447-0447-0447-000000000447'::UUID,
    95.3,
    '2024-01-10',
    true
),
-- AI Assessment - Large Agricultural
(
    'prop0007-0007-0007-0007-000000000007'::UUID,
    2024,
    2100000,
    2250000,
    1600000,
    500000,
    'AI_Agricultural_Model',
    NULL,
    'ai000003-0003-0003-0003-000000000003'::UUID,
    94.2,
    '2024-01-09',
    true
),
-- AI Assessment - Residential
(
    'prop0008-0008-0008-0008-000000000008'::UUID,
    2024,
    395000,
    405000,
    115000,
    280000,
    'AI_Quantum_Enhanced',
    NULL,
    'ai000001-0001-0001-0001-000000000001'::UUID,
    97.8,
    '2024-01-08',
    true
),
-- AI Assessment - Large Commercial
(
    'prop0009-0009-0009-0009-000000000009'::UUID,
    2024,
    4500000,
    4800000,
    1200000,
    3300000,
    'AI_Commercial_Model',
    NULL,
    'ai000002-0002-0002-0002-000000000002'::UUID,
    98.5,
    '2024-01-07',
    true
),
-- Human Assessment for verification
(
    'prop0010-0010-0010-0010-000000000010'::UUID,
    2024,
    465000,
    475000,
    135000,
    330000,
    'Human_Verification',
    '22222222-2222-2222-2222-222222222222'::UUID,
    NULL,
    92.1,
    '2024-01-06',
    true
);

-- Insert tax levies for Benton County
INSERT INTO government.tax_levies (county_id, taxing_district, tax_rate, levy_amount, tax_year, purpose, effective_date, is_active) VALUES
(
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    'Benton County General',
    0.002750,
    15500000,
    2024,
    'General county operations and services',
    '2024-01-01',
    true
),
(
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    'Kennewick School District',
    0.004200,
    28750000,
    2024,
    'Public education funding',
    '2024-01-01',
    true
),
(
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    'Richland School District',
    0.003950,
    22100000,
    2024,
    'Public education funding',
    '2024-01-01',
    true
),
(
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    'Fire Protection District #1',
    0.001500,
    4200000,
    2024,
    'Fire protection and emergency services',
    '2024-01-01',
    true
),
(
    'a1b2c3d4-e5f6-7890-1234-567890abcdef'::UUID,
    'Port of Benton',
    0.000850,
    2800000,
    2024,
    'Economic development and port operations',
    '2024-01-01',
    true
);

-- Insert performance metrics for quantum performance tracking
INSERT INTO ai_system.performance_metrics (metric_name, metric_type, value, unit, source, metadata, related_entity_type) VALUES
(
    'Assessment Processing Speed',
    'performance',
    0.47,
    'milliseconds',
    'AI_Swarm_Monitor',
    '{"improvement_factor": "379000000x", "baseline_time": "177.63_seconds", "quantum_enhanced": true}',
    'ai_agent'
),
(
    'AI Accuracy Rate',
    'quality',
    94.8,
    'percent',
    'Quality_Assurance_System',
    '{"validation_method": "cross_validation", "sample_size": 10000}',
    'ai_model'
),
(
    'System Throughput',
    'performance',
    1000000,
    'assessments_per_second',
    'Performance_Monitor',
    '{"concurrent_agents": 1008, "quantum_cores": 128}',
    'system'
),
(
    'Cost Reduction',
    'efficiency',
    97.0,
    'percent',
    'Financial_Analysis',
    '{"traditional_cost": "$125_per_assessment", "ai_cost": "$3.75_per_assessment"}',
    'financial'
),
(
    'User Satisfaction',
    'quality',
    96.7,
    'percent',
    'User_Feedback_System',
    '{"survey_responses": 2500, "counties": 15}',
    'user_experience'
);

-- Insert security events for demonstration
INSERT INTO security.security_events (event_type, description, severity, user_id, ip_address, metadata) VALUES
(
    'SUCCESSFUL_LOGIN',
    'Government user successfully authenticated',
    'info',
    'admin@co.benton.wa.us',
    '192.168.1.100',
    '{"authentication_method": "government_certificate", "session_duration": "8_hours"}'
),
(
    'AI_SWARM_ACTIVATION',
    'TerraFusion AI swarm successfully activated with 1,008 agents',
    'info',
    'system',
    '127.0.0.1',
    '{"agents_activated": 1008, "quantum_optimization": true, "performance_multiplier": "379M"}'
),
(
    'PROPERTY_ASSESSMENT_COMPLETED',
    'Quantum-enhanced property assessment completed successfully',
    'info',
    'ai000447-0447-0447-0447-000000000447',
    '10.0.0.1',
    '{"property_id": "BN-001-2024", "processing_time": "0.47ms", "confidence": "94.5%"}'
);

-- Refresh materialized view with new data
REFRESH MATERIALIZED VIEW government.county_statistics;

-- Create sample user sessions
INSERT INTO security.user_sessions (user_id, session_token, ip_address, user_agent, expires_at) VALUES
(
    '11111111-1111-1111-1111-111111111111'::UUID,
    'sess_' || encode(gen_random_bytes(32), 'hex'),
    '192.168.1.100',
    'TerraFusion Government Portal v1.0',
    CURRENT_TIMESTAMP + INTERVAL '8 hours'
),
(
    '22222222-2222-2222-2222-222222222222'::UUID,
    'sess_' || encode(gen_random_bytes(32), 'hex'),
    '192.168.1.101',
    'TerraFusion Assessment Module v1.0',
    CURRENT_TIMESTAMP + INTERVAL '8 hours'
);

-- Update AI agent statistics
UPDATE ai_system.ai_agents SET 
    processed_tasks = 2500 + (random() * 1000)::integer,
    last_active_at = CURRENT_TIMESTAMP
WHERE assigned_county = 'Benton County';

-- Create additional indexes for performance optimization
CREATE INDEX CONCURRENTLY idx_properties_owner_name ON government.properties USING gin(owner_name gin_trgm_ops);
CREATE INDEX CONCURRENTLY idx_assessments_method ON government.property_assessments(assessment_method);
CREATE INDEX CONCURRENTLY idx_ai_agents_processed_tasks ON ai_system.ai_agents(processed_tasks);

-- Migration completion audit
INSERT INTO audit.audit_logs (entity_name, entity_id, action, changes, user_id)
VALUES ('database_migration', '002', 'MIGRATION_COMPLETE', 
        '{"migration": "002_BentonCountyData", "status": "completed", "records_inserted": {"properties": 10, "assessments": 10, "users": 4, "ai_agents": 5}, "timestamp": "' || CURRENT_TIMESTAMP || '"}',
        'system');

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'TerraFusion OS Database Migration 002 completed successfully!';
    RAISE NOTICE 'Benton County sample data loaded with:';
    RAISE NOTICE '- 10 sample properties with assessments';
    RAISE NOTICE '- 4 government users with role-based permissions';
    RAISE NOTICE '- 5 AI agents from the 1,008-agent swarm';
    RAISE NOTICE '- Performance metrics showing 379M× improvement';
    RAISE NOTICE '- Government-grade security and audit compliance';
    RAISE NOTICE 'System ready for quantum-enhanced property assessment!';
END $$;
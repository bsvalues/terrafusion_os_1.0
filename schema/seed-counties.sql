-- Seed data for OS counties registry
-- Initial county workspaces for TerraFusion Government OS

INSERT OR REPLACE INTO os_counties (
    county_id, county_name, state_code, status, population, parcels,
    modules_purchased, modules_developed, monthly_revenue, ai_agents_assigned,
    workspace_path, database_path, config_path
) VALUES 
-- Primary demo county: Benton County, WA
('wa-benton', 'Benton County', 'WA', 'ACTIVE', 204390, 89447, 12, 3, 45200.00, 50,
 'county-data/wa-benton', 'county-data/wa-benton/county.db', 'county-data/wa-benton/config.json'),

-- Additional demo counties
('ca-alameda', 'Alameda County', 'CA', 'ACTIVE', 1671000, 542000, 8, 1, 28900.00, 75,
 'county-data/ca-alameda', 'county-data/ca-alameda/county.db', 'county-data/ca-alameda/config.json'),

('tx-harris', 'Benton County Washington', 'TX', 'ACTIVE', 4713000, 1200000, 15, 5, 89500.00, 120,
 'county-data/tx-harris', 'county-data/tx-harris/county.db', 'county-data/tx-harris/config.json'),

('fl-miami-dade', 'Miami-Dade County', 'FL', 'ACTIVE', 2716000, 876000, 10, 2, 52300.00, 85,
 'county-data/fl-miami-dade', 'county-data/fl-miami-dade/county.db', 'county-data/fl-miami-dade/config.json'),

-- Additional production counties (for scale demonstration)
('ny-nassau', 'Nassau County', 'NY', 'ACTIVE', 1395000, 468000, 18, 4, 78900.00, 95,
 'county-data/ny-nassau', 'county-data/ny-nassau/county.db', 'county-data/ny-nassau/config.json'),

('az-maricopa', 'Maricopa County', 'AZ', 'ACTIVE', 4485000, 1890000, 22, 7, 156700.00, 145,
 'county-data/az-maricopa', 'county-data/az-maricopa/county.db', 'county-data/az-maricopa/config.json');

-- Seed initial module registrations
INSERT OR REPLACE INTO os_modules (
    module_id, module_name, module_type, version, status, port, priority, 
    dependencies, manifest
) VALUES
-- Tier 1: Core Government (Priority 1)
('gov-001', 'government-edition', 'core', '1.0.0', 'LOADED', 5001, 1, '[]', 
 '{"name": "Government Edition", "description": "Core government operations", "capabilities": ["citizen_services", "basic_administration"]}'),

('ai-001', 'costforge-ai', 'ai-core', '2.1.0', 'LOADED', 5002, 1, '["government-edition"]',
 '{"name": "CostForge AI Champion", "description": "AI-powered property assessment", "capabilities": ["property_valuation", "market_analysis"]}'),

('fin-001', 'terra-collections', 'finance', '1.5.0', 'LOADED', 5003, 1, '["government-edition"]',
 '{"name": "Terra Collections", "description": "Revenue collection system", "capabilities": ["tax_collection", "payment_processing"]}'),

('tax-001', 'terra-levy', 'tax', '1.3.0', 'LOADED', 5004, 1, '["terra-collections"]',
 '{"name": "Terra Levy", "description": "Tax assessment and billing", "capabilities": ["tax_calculation", "assessment_management"]}'),

('ai-002', 'ai-command-brain', 'ai-orchestration', '3.0.0', 'LOADED', 5005, 1, '[]',
 '{"name": "AI Command Brain", "description": "AI swarm orchestration", "capabilities": ["agent_coordination", "task_distribution"]}'),

('ai-003', 'ai-swarm', 'ai-coordination', '2.5.0', 'LOADED', 5006, 1, '["ai-command-brain"]',
 '{"name": "AI Swarm", "description": "Distributed AI agent system", "capabilities": ["parallel_processing", "intelligent_automation"]}'),

-- Tier 2: Essential Operations (Priority 2)
('ana-001', 'terra-insight', 'analytics', '1.8.0', 'LOADED', 5007, 2, '["government-edition"]',
 '{"name": "Terra Insight", "description": "Government analytics platform", "capabilities": ["data_analysis", "reporting", "dashboards"]}'),

('eco-001', 'marketplace', 'economy', '1.2.0', 'LOADED', 5008, 2, '[]',
 '{"name": "Marketplace Champion", "description": "Module marketplace system", "capabilities": ["module_sales", "revenue_tracking"]}'),

('gis-001', 'gispro', 'mapping', '2.0.0', 'LOADED', 5009, 2, '["government-edition"]',
 '{"name": "GIS Pro", "description": "Geographic information system", "capabilities": ["mapping", "spatial_analysis", "parcel_management"]}'),

('rec-001', 'Terrafusion-PublicRecords', 'records', '1.6.0', 'LOADED', 5010, 2, '["government-edition"]',
 '{"name": "Public Records", "description": "Public records management", "capabilities": ["document_management", "records_search", "compliance"]}'),

('prop-001', 'property-workbench', 'property', '1.4.0', 'LOADED', 5011, 2, '["costforge-ai", "gispro"]',
 '{"name": "Property Workbench", "description": "Property management suite", "capabilities": ["property_analysis", "assessment_tools"]}'),

('int-001', 'unified-system', 'integration', '1.1.0', 'LOADED', 5012, 2, '[]',
 '{"name": "Unified System", "description": "System integration hub", "capabilities": ["data_integration", "api_management"]}');

-- Seed AI agent hierarchy
INSERT OR REPLACE INTO ai_agents (
    agent_id, agent_type, specialization, county_id, status, parent_agent, hierarchy_level, capabilities
) VALUES
-- Supreme Commander
('supreme-commander-claude', 'SUPREME_COMMANDER', 'strategic_coordination', NULL, 'ACTIVE', NULL, 0,
 '["strategic_planning", "swarm_coordination", "resource_allocation", "crisis_management"]'),

-- Field Generals (sample)
('field-general-001', 'FIELD_GENERAL', 'property_operations', 'wa-benton', 'ACTIVE', 'supreme-commander-claude', 1,
 '["property_assessment", "tax_calculation", "valuation_analysis"]'),
 
('field-general-002', 'FIELD_GENERAL', 'citizen_services', 'wa-benton', 'ACTIVE', 'supreme-commander-claude', 1,
 '["permit_processing", "service_requests", "citizen_communication"]'),

('field-general-003', 'FIELD_GENERAL', 'records_management', 'wa-benton', 'ACTIVE', 'supreme-commander-claude', 1,
 '["document_processing", "records_search", "compliance_monitoring"]'),

-- Operational Forces (sample)
('ops-agent-001', 'OPERATIONAL', 'property_assessment', 'wa-benton', 'ACTIVE', 'field-general-001', 2,
 '["automated_valuation", "comparable_analysis", "market_trends"]'),

('ops-agent-002', 'OPERATIONAL', 'permit_review', 'wa-benton', 'ACTIVE', 'field-general-002', 2,
 '["code_compliance", "safety_analysis", "approval_workflow"]'),

('ops-agent-003', 'OPERATIONAL', 'tax_processing', 'wa-benton', 'ACTIVE', 'field-general-001', 2,
 '["tax_calculation", "payment_processing", "delinquency_management"]');

-- Seed sample marketplace transactions
INSERT OR REPLACE INTO marketplace_transactions (
    transaction_id, buyer_county, seller_county, module_name, amount, county_share, platform_share, status
) VALUES
('txn-001', 'ca-alameda', 'wa-benton', 'agricultural-permits', 5000.00, 3500.00, 1500.00, 'COMPLETED'),
('txn-002', 'tx-harris', 'wa-benton', 'wine-industry-tracking', 7500.00, 5250.00, 2250.00, 'COMPLETED'),
('txn-003', 'fl-miami-dade', 'az-maricopa', 'flood-management', 12000.00, 8400.00, 3600.00, 'COMPLETED'),
('txn-004', 'ny-nassau', 'wa-benton', 'irrigation-management', 3500.00, 2450.00, 1050.00, 'COMPLETED');

-- Seed module catalog
INSERT OR REPLACE INTO module_catalog (
    catalog_id, module_name, developer_county, category, description, price, downloads, rating, tags
) VALUES
('cat-001', 'agricultural-permits', 'wa-benton', 'Permits & Licensing', 
 'Specialized permit system for agricultural operations, including livestock, crops, and farm structures', 
 5000.00, 15, 4.8, '["agriculture", "permits", "farming", "livestock"]'),

('cat-002', 'wine-industry-tracking', 'wa-benton', 'Industry Specific',
 'Comprehensive wine industry management including vineyard permits, production tracking, and compliance',
 7500.00, 8, 4.9, '["wine", "agriculture", "compliance", "production"]'),

('cat-003', 'irrigation-management', 'wa-benton', 'Utilities & Infrastructure',
 'Water rights management and irrigation system tracking for agricultural counties',
 3500.00, 22, 4.7, '["water", "irrigation", "agriculture", "utilities"]'),

('cat-004', 'flood-management', 'az-maricopa', 'Emergency Management',
 'Flood zone mapping, early warning systems, and emergency response coordination',
 12000.00, 12, 4.6, '["emergency", "flood", "mapping", "response"]'),

('cat-005', 'tourism-permits', 'fl-miami-dade', 'Economic Development',
 'Tourism business permits, event licensing, and hospitality industry management',
 6500.00, 18, 4.5, '["tourism", "permits", "hospitality", "events"]');


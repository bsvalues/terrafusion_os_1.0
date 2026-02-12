-- West Coast Expansion Seed Data
USE benton_county_assessor;

-- Insert state configurations
INSERT INTO state_configurations (state_code, state_name, regulatory_framework, tax_assessment_rules, compliance_requirements) VALUES
('CA', 'California', 
 '{"prop13": true, "assessment_cap": 2.0, "reassessment_triggers": ["sale", "new_construction", "change_of_ownership"], "appeals_process": "county_board"}',
 '{"assessment_date": "January 1", "lien_date": "January 1", "tax_year": "July 1 - June 30", "supplemental_assessments": true}',
 '{"data_privacy": "CCPA", "accessibility": "ADA", "public_records": "CPRA", "security": "NIST"}'),
('OR', 'Oregon', 
 '{"measure5": true, "measure50": true, "assessment_cap": 3.0, "maximum_assessed_value": true, "appeals_process": "county_board"}',
 '{"assessment_date": "January 1", "lien_date": "July 1", "tax_year": "July 1 - June 30", "compression": true}',
 '{"data_privacy": "Oregon_Privacy_Act", "accessibility": "ADA", "public_records": "Oregon_Public_Records_Law", "security": "NIST"}'),
('NV', 'Nevada', 
 '{"assessment_ratio": 0.35, "reappraisal_cycle": 5, "appeals_process": "county_board", "abatement_programs": true}',
 '{"assessment_date": "July 1", "lien_date": "July 1", "tax_year": "July 1 - June 30", "partial_abatements": true}',
 '{"data_privacy": "Nevada_Privacy_Law", "accessibility": "ADA", "public_records": "Nevada_Public_Records_Act", "security": "NIST"}');

-- Insert California market opportunities (Tier 1 targets)
INSERT INTO market_opportunities (state_code, county_name, opportunity_size, population, total_parcels, estimated_assessed_value, current_vendor, estimated_contract_value, probability_score, priority_ranking, notes) VALUES
('CA', 'Riverside County', 'mega', 2418185, 890000, 425000000000, 'Legacy System (In-house)', 2500000, 0.75, 1, 'Largest county by area in CA, rapid growth, current system aging'),
('CA', 'San Bernardino County', 'mega', 2181654, 750000, 380000000000, 'Tyler Technologies', 2200000, 0.65, 2, 'Contract expires 2026, budget constraints, looking for cost savings'),
('CA', 'Fresno County', 'large', 1008654, 425000, 185000000000, 'CoreLogic', 1800000, 0.80, 3, 'Agricultural focus aligns with our expertise, contract expires 2025'),
('CA', 'Kern County', 'large', 909235, 380000, 165000000000, 'In-house Legacy', 1600000, 0.85, 4, 'Oil/agriculture mix, seeking modernization, budget approved'),
('CA', 'Tulare County', 'medium', 473117, 195000, 95000000000, 'Aumentum (CGI)', 1200000, 0.70, 5, 'Agricultural county, current vendor issues reported'),
('CA', 'Imperial County', 'medium', 179702, 85000, 45000000000, 'Legacy System', 900000, 0.90, 6, 'Border county, agricultural focus, ready to modernize'),

-- Insert Oregon market opportunities
('OR', 'Washington County', 'large', 695000, 285000, 195000000000, 'Aumentum (CGI)', 1500000, 0.60, 7, 'Tech corridor, high property values, contract expires 2026'),
('OR', 'Clackamas County', 'large', 421401, 175000, 125000000000, 'Tyler Technologies', 1300000, 0.65, 8, 'Mixed urban/rural, seeking better rural property tools'),
('OR', 'Marion County', 'medium', 384149, 165000, 85000000000, 'In-house System', 1100000, 0.75, 9, 'State capital area, agricultural mix, modernization planned'),
('OR', 'Lane County', 'medium', 382067, 195000, 78000000000, 'Legacy System', 1000000, 0.80, 10, 'University town, timber properties, system replacement needed'),
('OR', 'Jackson County', 'medium', 223259, 125000, 65000000000, 'CoreLogic', 850000, 0.70, 11, 'Wine country, tourism properties, seeking specialization'),

-- Insert Nevada market opportunities
('NV', 'Washoe County', 'large', 486492, 195000, 145000000000, 'Tyler Technologies', 1400000, 0.55, 12, 'Reno area, gaming properties, contract expires 2027'),
('NV', 'Carson City', 'small', 58639, 28000, 18000000000, 'In-house System', 450000, 0.85, 13, 'State capital, independent city-county, ready to upgrade'),
('NV', 'Douglas County', 'small', 48905, 35000, 28000000000, 'Legacy System', 500000, 0.80, 14, 'Lake Tahoe properties, high-value residential, needs specialization'),
('NV', 'Lyon County', 'small', 59235, 45000, 22000000000, 'Manual Process', 550000, 0.90, 15, 'Rural county, minimal automation, eager to modernize');

-- Insert initial West Coast county implementations (planning phase)
INSERT INTO county_implementations (
    county_name, state, fips_code, population, total_parcels, total_assessed_value,
    implementation_status, implementation_progress, start_date, target_go_live,
    assessor_name, assessor_email, assessor_phone, contract_value, annual_maintenance,
    region, market_tier, special_requirements
) VALUES 
-- California Tier 1 Targets
(
    'Riverside County', 'CA', '06065', 2418185, 890000, 425000000000.00,
    'planning', 2.00, '2025-08-01', '2026-01-15',
    'Peter Aldana', 'assessor@rivco.org', '951-955-6200',
    2500000.00, 650000.00, 'West Coast', 'tier_1',
    'Largest county by area in US; Desert/mountain properties; Rapid growth areas; Gaming properties'
),
(
    'Fresno County', 'CA', '06019', 1008654, 425000, 185000000000.00,
    'planning', 5.00, '2025-09-01', '2026-02-01',
    'Paul Dictos', 'assessor@co.fresno.ca.us', '559-600-3534',
    1800000.00, 475000.00, 'West Coast', 'tier_1',
    'Major agricultural county; Central Valley properties; Diverse crop valuations; Water rights considerations'
),
(
    'Kern County', 'CA', '06029', 909235, 380000, 165000000000.00,
    'planning', 8.00, '2025-10-01', '2026-03-01',
    'Jon Lifquist', 'assessor@kerncounty.com', '661-868-3485',
    1600000.00, 425000.00, 'West Coast', 'tier_1',
    'Oil and gas properties; Agricultural lands; Bakersfield urban area; Energy infrastructure'
),

-- Oregon Tier 2 Targets
(
    'Washington County', 'OR', '41067', 695000, 285000, 195000000000.00,
    'planning', 1.00, '2025-11-01', '2026-04-01',
    'Scott Karter', 'scott.karter@co.washington.or.us', '503-846-8741',
    1500000.00, 395000.00, 'West Coast', 'tier_1',
    'Tech corridor properties; Nike headquarters; High-value residential; Mixed urban/suburban'
),
(
    'Marion County', 'OR', '41047', 384149, 165000, 85000000000.00,
    'planning', 3.00, '2026-01-01', '2026-06-01',
    'Tait Keller', 'tkeller@co.marion.or.us', '503-588-5036',
    1100000.00, 290000.00, 'West Coast', 'tier_2',
    'State capital area; Agricultural/urban mix; Government properties; Historic districts'
),

-- Nevada Tier 3 Targets
(
    'Carson City', 'NV', '32510', 58639, 28000, 18000000000.00,
    'planning', 10.00, '2026-02-01', '2026-07-01',
    'Dave Dawley', 'ddawley@carson.org', '775-283-7300',
    450000.00, 125000.00, 'West Coast', 'tier_3',
    'Independent city-county; State capital; Government properties; Historic properties'
);

-- Insert competitive analysis for key counties
INSERT INTO competitive_analysis (county_implementation_id, competitor_name, market_share, strengths, weaknesses, threat_level) VALUES
((SELECT id FROM county_implementations WHERE county_name = 'Riverside County'), 'Legacy In-house System', 100.00, 'Existing staff knowledge, No licensing fees', 'Outdated technology, Limited functionality, High maintenance costs', 'low'),
((SELECT id FROM county_implementations WHERE county_name = 'Fresno County'), 'CoreLogic', 100.00, 'Established presence, Agricultural expertise', 'High costs, Limited customization, Poor support', 'medium'),
((SELECT id FROM county_implementations WHERE county_name = 'Washington County'), 'Aumentum (CGI)', 100.00, 'Large vendor, Comprehensive suite', 'Expensive, Complex implementation, Poor user experience', 'high');

-- Insert revenue projections for first 3 years
INSERT INTO revenue_projections (county_implementation_id, projection_year, base_contract_value, maintenance_revenue, total_projected_revenue, confidence_level) VALUES
-- Riverside County projections
((SELECT id FROM county_implementations WHERE county_name = 'Riverside County'), 2026, 2500000.00, 650000.00, 3150000.00, 'high'),
((SELECT id FROM county_implementations WHERE county_name = 'Riverside County'), 2027, 0.00, 650000.00, 650000.00, 'high'),
((SELECT id FROM county_implementations WHERE county_name = 'Riverside County'), 2028, 0.00, 682500.00, 682500.00, 'medium'),

-- Fresno County projections
((SELECT id FROM county_implementations WHERE county_name = 'Fresno County'), 2026, 1800000.00, 475000.00, 2275000.00, 'high'),
((SELECT id FROM county_implementations WHERE county_name = 'Fresno County'), 2027, 0.00, 475000.00, 475000.00, 'high'),
((SELECT id FROM county_implementations WHERE county_name = 'Fresno County'), 2028, 0.00, 498750.00, 498750.00, 'medium');

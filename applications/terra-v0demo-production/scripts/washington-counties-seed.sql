-- Washington Counties Expansion Seed Data
USE benton_county_assessor;

-- Insert Benton County as reference (already live)
INSERT INTO county_implementations (
    county_name, state, fips_code, population, total_parcels, total_assessed_value,
    implementation_status, implementation_progress, start_date, target_go_live, actual_go_live,
    assessor_name, assessor_email, assessor_phone, contract_value, annual_maintenance
) VALUES (
    'Benton County', 'WA', '53005', 205700, 89247, 12847392000.00,
    'live', 100.00, '2024-10-15', '2025-01-15', '2025-01-15',
    'Jennifer Martinez', 'assessor@co.benton.wa.us', '509-736-3085',
    450000.00, 125000.00
);

-- Insert the 8 new Washington counties
INSERT INTO county_implementations (
    county_name, state, fips_code, population, total_parcels, total_assessed_value,
    implementation_status, implementation_progress, start_date, target_go_live,
    assessor_name, assessor_email, assessor_phone, contract_value, annual_maintenance,
    special_requirements
) VALUES 
-- Yakima County (already in progress)
(
    'Yakima County', 'WA', '53077', 256728, 156789, 18234567000.00,
    'data_migration', 65.00, '2024-12-01', '2025-03-01',
    'David Thompson', 'assessor@co.yakima.wa.us', '509-574-1100',
    525000.00, 145000.00,
    'Large agricultural property base requires specialized valuation models'
),
-- Walla Walla County
(
    'Walla Walla County', 'WA', '53071', 62584, 32450, 7856000000.00,
    'contract_signed', 15.00, '2025-01-15', '2025-04-15',
    'Michael Johnson', 'mjohnson@co.walla-walla.wa.us', '509-524-2560',
    325000.00, 90000.00,
    'Wine country properties require specialized agricultural valuation models'
),
-- Asotin County
(
    'Asotin County', 'WA', '53003', 22285, 12850, 1950000000.00,
    'planning', 5.00, '2025-02-01', '2025-05-01',
    'Sarah Williams', 'swilliams@co.asotin.wa.us', '509-243-2210',
    275000.00, 75000.00,
    'Small county with limited IT resources; needs extra implementation support'
),
-- Klickitat County
(
    'Klickitat County', 'WA', '53039', 22425, 18750, 3250000000.00,
    'planning', 10.00, '2025-02-15', '2025-05-15',
    'Robert Chen', 'rchen@klickitatcounty.org', '509-773-3715',
    285000.00, 80000.00,
    'Significant renewable energy properties (wind farms) requiring specialized valuation'
),
-- Grant County
(
    'Grant County', 'WA', '53025', 97733, 65400, 9850000000.00,
    'planning', 8.00, '2025-03-01', '2025-06-01',
    'Lisa Rodriguez', 'lrodriguez@grantcountywa.gov', '509-754-2011',
    375000.00, 105000.00,
    'Large agricultural and irrigation district properties; Columbia Basin Project impacts'
),
-- Cowlitz County
(
    'Cowlitz County', 'WA', '53015', 110730, 58750, 12450000000.00,
    'planning', 3.00, '2025-03-15', '2025-06-15',
    'Thomas Wilson', 'twilson@co.cowlitz.wa.us', '360-577-3010',
    385000.00, 110000.00,
    'Significant industrial properties and timber lands requiring specialized valuation'
),
-- San Juan County
(
    'San Juan County', 'WA', '53055', 17788, 19850, 14750000000.00,
    'planning', 2.00, '2025-04-01', '2025-07-01',
    'Emily Parker', 'eparker@sanjuanco.com', '360-378-2172',
    295000.00, 85000.00,
    'Island properties with high-value waterfront parcels; seasonal population fluctuations'
),
-- Island County
(
    'Island County', 'WA', '53029', 86280, 47500, 16850000000.00,
    'planning', 1.00, '2025-04-15', '2025-07-15',
    'Daniel Kim', 'dkim@islandcountywa.gov', '360-679-7303',
    365000.00, 100000.00,
    'Naval Air Station impact; mix of high-value waterfront and rural properties'
);

-- Insert implementation milestones for each county
-- Yakima County (already in progress)
SET @yakima_id = (SELECT id FROM county_implementations WHERE county_name = 'Yakima County');
INSERT INTO implementation_milestones (county_implementation_id, milestone_name, description, planned_date, actual_date, status, completion_percentage) VALUES
(@yakima_id, 'Contract Signing', 'Execute service agreement', '2024-12-01', '2024-12-01', 'completed', 100.00),
(@yakima_id, 'Kickoff Meeting', 'Initial project planning and team introductions', '2024-12-08', '2024-12-08', 'completed', 100.00),
(@yakima_id, 'Requirements Gathering', 'Document county-specific requirements', '2024-12-15', '2024-12-20', 'completed', 100.00),
(@yakima_id, 'Data Migration Planning', 'Analyze source data and create migration strategy', '2024-12-22', '2024-12-28', 'completed', 100.00),
(@yakima_id, 'Data Migration Execution', 'Extract, transform, and load county data', '2025-01-05', NULL, 'in_progress', 65.00),
(@yakima_id, 'System Configuration', 'Configure system for county requirements', '2025-01-25', NULL, 'pending', 0.00),
(@yakima_id, 'User Training', 'Train county staff on system use', '2025-02-10', NULL, 'pending', 0.00),
(@yakima_id, 'User Acceptance Testing', 'Validate system with county users', '2025-02-20', NULL, 'pending', 0.00),
(@yakima_id, 'Go-Live Preparation', 'Final preparations for production launch', '2025-02-25', NULL, 'pending', 0.00),
(@yakima_id, 'Go-Live', 'System production launch', '2025-03-01', NULL, 'pending', 0.00);

-- Walla Walla County (contract just signed)
SET @walla_walla_id = (SELECT id FROM county_implementations WHERE county_name = 'Walla Walla County');
INSERT INTO implementation_milestones (county_implementation_id, milestone_name, description, planned_date, status) VALUES
(@walla_walla_id, 'Contract Signing', 'Execute service agreement', '2025-01-15', 'completed'),
(@walla_walla_id, 'Kickoff Meeting', 'Initial project planning and team introductions', '2025-01-22', 'pending'),
(@walla_walla_id, 'Requirements Gathering', 'Document county-specific requirements', '2025-02-05', 'pending'),
(@walla_walla_id, 'Data Migration Planning', 'Analyze source data and create migration strategy', '2025-02-15', 'pending'),
(@walla_walla_id, 'Data Migration Execution', 'Extract, transform, and load county data', '2025-02-25', 'pending'),
(@walla_walla_id, 'System Configuration', 'Configure system for county requirements', '2025-03-15', 'pending'),
(@walla_walla_id, 'User Training', 'Train county staff on system use', '2025-03-25', 'pending'),
(@walla_walla_id, 'User Acceptance Testing', 'Validate system with county users', '2025-04-05', 'pending'),
(@walla_walla_id, 'Go-Live Preparation', 'Final preparations for production launch', '2025-04-10', 'pending'),
(@walla_walla_id, 'Go-Live', 'System production launch', '2025-04-15', 'pending');

-- Add implementation team members for active counties
-- Yakima County team
INSERT INTO implementation_team (county_implementation_id, member_name, role, email, phone, start_date) VALUES
(@yakima_id, 'Jessica Martinez', 'project_manager', 'jmartinez@terrafusion.com', '206-555-1001', '2024-12-01'),
(@yakima_id, 'David Chen', 'data_migration_specialist', 'dchen@terrafusion.com', '206-555-1002', '2024-12-01'),
(@yakima_id, 'Samantha Wilson', 'configuration_specialist', 'swilson@terrafusion.com', '206-555-1003', '2024-12-15'),
(@yakima_id, 'Robert Johnson', 'trainer', 'rjohnson@terrafusion.com', '206-555-1004', '2025-01-15'),
(@yakima_id, 'Maria Rodriguez', 'county_liaison', 'mrodriguez@co.yakima.wa.us', '509-574-1105', '2024-12-01');

-- Walla Walla County team
INSERT INTO implementation_team (county_implementation_id, member_name, role, email, phone, start_date) VALUES
(@walla_walla_id, 'Jessica Martinez', 'project_manager', 'jmartinez@terrafusion.com', '206-555-1001', '2025-01-15'),
(@walla_walla_id, 'Alex Thompson', 'data_migration_specialist', 'athompson@terrafusion.com', '206-555-1005', '2025-01-15'),
(@walla_walla_id, 'Samantha Wilson', 'configuration_specialist', 'swilson@terrafusion.com', '206-555-1003', '2025-02-01'),
(@walla_walla_id, 'Lisa Brown', 'county_liaison', 'lbrown@co.walla-walla.wa.us', '509-524-2565', '2025-01-15');

-- Add county configurations for active counties
-- Yakima County configuration
INSERT INTO county_configurations (county_implementation_id, tax_year, assessment_date, tax_roll_deadline, property_types, exemption_types) VALUES
(@yakima_id, 2025, '2025-01-01', '2025-05-31', 
'["residential", "commercial", "industrial", "agricultural", "vineyard", "orchard", "hop_farm", "exempt"]',
'["senior", "disabled", "veteran", "nonprofit", "religious", "agricultural", "open_space"]');

-- Walla Walla County configuration
INSERT INTO county_configurations (county_implementation_id, tax_year, assessment_date, tax_roll_deadline, property_types, exemption_types) VALUES
(@walla_walla_id, 2025, '2025-01-01', '2025-05-31', 
'["residential", "commercial", "industrial", "agricultural", "vineyard", "orchard", "exempt"]',
'["senior", "disabled", "veteran", "nonprofit", "religious", "agricultural", "open_space"]');

-- Add implementation issues for active counties
-- Yakima County issues
INSERT INTO implementation_issues (county_implementation_id, issue_type, severity, title, description, reported_date, status, assigned_to) VALUES
(@yakima_id, 'data', 'medium', 'Agricultural parcel classification inconsistency', 'Source data has inconsistent classification for agricultural parcels between different systems', '2025-01-05', 'in_progress', 'David Chen'),
(@yakima_id, 'integration', 'high', 'GIS integration complexity', 'County uses custom GIS system requiring specialized integration approach', '2025-01-08', 'open', 'Samantha Wilson');

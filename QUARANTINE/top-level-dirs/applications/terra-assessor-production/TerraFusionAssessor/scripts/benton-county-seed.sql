USE benton_county_assessor;

INSERT INTO counties (name, state, fips_code, assessor_name, assessor_email, tax_year, assessment_date, tax_roll_deadline) VALUES
('Benton County', 'WA', '53005', 'Jennifer Martinez', 'assessor@co.benton.wa.us', 2025, '2025-01-01', '2025-05-31');

INSERT INTO users (county_id, username, email, password_hash, first_name, last_name, role, department, phone) VALUES
(1, 'jmartinez', 'assessor@co.benton.wa.us', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMNpkt9Uf/KzO', 'Jennifer', 'Martinez', 'assessor', 'Assessment', '509-736-3  'Jennifer', 'Martinez', 'assessor', 'Assessment', '509-736-3085'),
(1, 'sappraiser', 'senior.appraiser@co.benton.wa.us', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMNpkt9Uf/KzO', 'Sarah', 'Johnson', 'appraiser', 'Residential Appraisal', '509-736-3086'),
(1, 'mchen', 'commercial.appraiser@co.benton.wa.us', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMNpkt9Uf/KzO', 'Michael', 'Chen', 'appraiser', 'Commercial Appraisal', '509-736-3087'),
(1, 'clerk1', 'clerk@co.benton.wa.us', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMNpkt9Uf/KzO', 'Emma', 'Williams', 'clerk', 'Assessment Support', '509-736-3088');

INSERT INTO property_parcels (county_id, parcel_number, property_address, owner_name, owner_address, property_type, land_use_code, zoning, latitude, longitude, lot_size_acres, year_built, building_sqft, bedrooms, bathrooms, condition_rating, quality_rating) VALUES
(1, '362301-100045', '123 Wine Country Rd, Prosser, WA 99350', 'John & Mary Smith', '123 Wine Country Rd, Prosser, WA 99350', 'residential', 'R1', 'R-1', 46.2043, -119.7695, 2.5, 2018, 2850, 4, 3.5, 'excellent', 'good'),
(1, '362301-200078', '456 River View Dr, Richland, WA 99354', 'Robert Johnson', '456 River View Dr, Richland, WA 99354', 'residential', 'R1', 'R-2', 46.2857, -119.2840, 0.25, 2015, 2200, 3, 2.5, 'good', 'average'),
(1, '362301-150032', '789 Agricultural Way, Kennewick, WA 99337', 'Columbia Valley Farms LLC', 'PO Box 1234, Kennewick, WA 99337', 'agricultural', 'AG', 'AG-20', 46.2112, -119.1372, 45.8, 1995, 3200, 0, 0, 'average', 'average'),
(1, '362301-300012', '321 Commerce Blvd, Richland, WA 99352', 'Tri-Cities Business Center', '321 Commerce Blvd, Richland, WA 99352', 'commercial', 'C1', 'C-2', 46.2857, -119.2840, 1.2, 2010, 15000, 0, 0, 'good', 'good'),
(1, '362301-400089', '654 Industrial Park Dr, Pasco, WA 99301', 'Pacific Northwest Manufacturing', '654 Industrial Park Dr, Pasco, WA 99301', 'industrial', 'I1', 'M-1', 46.2396, -119.1006, 5.5, 2008, 45000, 0, 0, 'good', 'average');

INSERT INTO assessments (parcel_id, tax_year, assessment_date, land_value, improvement_value, total_assessed_value, market_value, assessment_method, review_status) VALUES
(1, 2025, '2025-01-01', 125000.00, 360000.00, 485000.00, 485000.00, 'sales_comparison', 'approved'),
(2, 2025, '2025-01-01', 85000.00, 240000.00, 325000.00, 325000.00, 'sales_comparison', 'approved'),
(3, 2025, '2025-01-01', 458000.00, 125000.00, 583000.00, 583000.00, 'cost', 'reviewed'),
(4, 2025, '2025-01-01', 180000.00, 520000.00, 700000.00, 700000.00, 'income', 'approved'),
(5, 2025, '2025-01-01', 275000.00, 825000.00, 1100000.00, 1100000.00, 'cost', 'approved');

INSERT INTO property_sales (parcel_id, sale_date, sale_price, buyer_name, seller_name, sale_type, verified) VALUES
(1, '2024-08-15', 475000.00, 'John & Mary Smith', 'Previous Owner', 'arms_length', TRUE),
(2, '2024-09-22', 315000.00, 'Robert Johnson', 'Estate of Jane Doe', 'estate_sale', TRUE),
(4, '2024-07-10', 685000.00, 'Tri-Cities Business Center', 'Local Investor', 'arms_length', TRUE);

INSERT INTO appeals (parcel_id, tax_year, appeal_type, filing_date, appellant_name, appellant_contact, current_assessment, requested_assessment, reason_for_appeal, status) VALUES
(1, 2025, 'assessment', '2025-01-10', 'John Smith', 'john.smith@email.com, 509-555-0123', 485000.00, 450000.00, 'Property assessment too high compared to recent sales in neighborhood', 'filed'),
(3, 2025, 'classification', '2025-01-08', 'Columbia Valley Farms LLC', 'manager@cvfarms.com, 509-555-0456', 583000.00, 583000.00, 'Request agricultural classification for vineyard portion of property', 'scheduled');

INSERT INTO exemptions (parcel_id, tax_year, exemption_type, application_date, applicant_name, applicant_contact, status, exemption_amount) VALUES
(2, 2025, 'senior', '2024-12-15', 'Robert Johnson', 'robert.johnson@email.com, 509-555-0789', 'approved', 50000.00);

INSERT INTO market_analysis (county_id, analysis_date, property_type, median_sale_price, average_sale_price, price_per_sqft, sales_volume, days_on_market, assessment_ratio, coefficient_of_dispersion) VALUES
(1, '2024-12-31', 'residential', 425000.00, 445000.00, 185.50, 2847, 45, 0.987, 8.2),
(1, '2024-12-31', 'commercial', 1250000.00, 1450000.00, 125.00, 156, 89, 0.992, 12.5),
(1, '2024-12-31', 'agricultural', 12500.00, 15800.00, 0.28, 89, 120, 0.978, 15.8);

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

SELECT 'Benton County and Washington expansion data seeded successfully' as status;

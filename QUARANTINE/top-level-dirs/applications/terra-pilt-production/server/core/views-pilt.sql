-- 🚀 TERRAFUSION SQL VIEWS ARCHITECTURE
-- Clean data transformation layer for PILT calculations
-- Implements architectural review recommendations

-- View 1: PILT Assessed Values by Category and District
CREATE VIEW IF NOT EXISTS vw_pilt_assessed_values AS
SELECT
    a.district_name,
    a.category,
    a.unit,
    a.quantity,
    r.value_rate,
    a.quantity * r.value_rate AS assessed_value_cat,
    a.import_date,
    a.validation_status
FROM stg_pilt_acres a
JOIN dim_pilt_value_rates r
    ON a.category = r.category
    AND a.unit = r.unit
    AND r.effective_date <= CURRENT_DATE
    AND (r.expiration_date IS NULL OR r.expiration_date > CURRENT_DATE)
WHERE a.validation_status = 'validated' OR a.validation_status = 'pending';

-- View 2: PILT District Total Assessed Values
CREATE VIEW IF NOT EXISTS vw_pilt_district_totals AS
SELECT
    district_name,
    SUM(assessed_value_cat) AS total_assessed_value,
    COUNT(*) AS category_count,
    MAX(import_date) AS last_updated
FROM vw_pilt_assessed_values
GROUP BY district_name;

-- View 3: PILT Charges by District (before deductions)
CREATE VIEW IF NOT EXISTS vw_pilt_charges AS
SELECT
    d.district_name,
    d.total_assessed_value,
    l.levy_rate_per_1000,
    l.levy_type,
    l.budget_amount,
    l.tax_base,
    l.year,
    (d.total_assessed_value / 1000) * l.levy_rate_per_1000 AS gross_levy_amount,
    COALESCE(ded.deduction_81_874, 0) AS deduction_81_874,
    ((d.total_assessed_value / 1000) * l.levy_rate_per_1000) - COALESCE(ded.deduction_81_874, 0) AS net_pilt_due
FROM vw_pilt_district_totals d
JOIN stg_levy_rates_enhanced l
    ON d.district_name = l.district_name
LEFT JOIN stg_pilt_deductions ded
    ON d.district_name = ded.district_name
    AND l.year = ded.year
WHERE l.validation_status IN ('validated', 'pending')
    AND l.levy_type = 'regular';

-- View 4: PILT Summary by Year
CREATE VIEW IF NOT EXISTS vw_pilt_summary AS
SELECT
    year,
    COUNT(DISTINCT district_name) AS district_count,
    SUM(total_assessed_value) AS total_assessed_value,
    SUM(gross_levy_amount) AS total_gross_levy,
    SUM(deduction_81_874) AS total_deductions,
    SUM(net_pilt_due) AS total_pilt_due,
    AVG(levy_rate_per_1000) AS avg_levy_rate
FROM vw_pilt_charges
GROUP BY year
ORDER BY year DESC;

-- View 5: PILT Distribution Percentages
CREATE VIEW IF NOT EXISTS vw_pilt_distribution_percentages AS
SELECT
    c.*,
    (c.net_pilt_due / s.total_pilt_due) * 100 AS distribution_percentage,
    s.total_pilt_due AS county_total_pilt
FROM vw_pilt_charges c
JOIN vw_pilt_summary s ON c.year = s.year;

-- View 6: PILT Validation Dashboard
CREATE VIEW IF NOT EXISTS vw_pilt_validation_dashboard AS
SELECT
    'Acres Data' AS data_type,
    COUNT(*) AS total_records,
    SUM(CASE WHEN validation_status = 'validated' THEN 1 ELSE 0 END) AS validated_records,
    SUM(CASE WHEN validation_status = 'error' THEN 1 ELSE 0 END) AS error_records,
    SUM(CASE WHEN validation_status = 'pending' THEN 1 ELSE 0 END) AS pending_records,
    MAX(import_date) AS last_import
FROM stg_pilt_acres
UNION ALL
SELECT
    'Levy Rates' AS data_type,
    COUNT(*) AS total_records,
    SUM(CASE WHEN validation_status = 'validated' THEN 1 ELSE 0 END) AS validated_records,
    SUM(CASE WHEN validation_status = 'error' THEN 1 ELSE 0 END) AS error_records,
    SUM(CASE WHEN validation_status = 'pending' THEN 1 ELSE 0 END) AS pending_records,
    MAX(import_date) AS last_import
FROM stg_levy_rates_enhanced;

-- View 7: Real-time PILT Calculation (matches existing system)
CREATE VIEW IF NOT EXISTS vw_real_time_pilt AS
SELECT
    d.district_name,
    d.total_assessed_value,
    l.levy_rate_per_1000,
    l.tax_base,
    CASE 
        WHEN l.tax_base > 0 THEN (l.tax_base / (SELECT SUM(tax_base) FROM stg_levy_rates_enhanced WHERE year = l.year)) * 100
        ELSE (d.total_assessed_value / (SELECT SUM(total_assessed_value) FROM vw_pilt_district_totals)) * 100
    END AS calculated_percentage,
    ((d.total_assessed_value / 1000) * l.levy_rate_per_1000) - COALESCE(ded.deduction_81_874, 0) AS pilt_amount,
    l.year,
    'SQL Views Calculation' AS calculation_method
FROM vw_pilt_district_totals d
JOIN stg_levy_rates_enhanced l ON d.district_name = l.district_name
LEFT JOIN stg_pilt_deductions ded ON d.district_name = ded.district_name AND l.year = ded.year
WHERE l.levy_type = 'regular'
ORDER BY pilt_amount DESC; 
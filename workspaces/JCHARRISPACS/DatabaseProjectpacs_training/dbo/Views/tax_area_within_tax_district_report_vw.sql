
CREATE VIEW dbo.tax_area_within_tax_district_report_vw
AS
SELECT DISTINCT 
	tafa.year,
	tdt.priority,
	td.tax_district_desc,
	tafa.tax_district_id, 	
	ta.tax_area_number, 
	ta.tax_area_description
FROM tax_area AS ta WITH (NOLOCK)
JOIN tax_area_fund_assoc AS tafa WITH (NOLOCK) ON 
	ta.tax_area_id = tafa.tax_area_id 
JOIN dbo.tax_district AS td WITH (NOLOCK) ON 
	tafa.tax_district_id = td.tax_district_id
JOIN tax_district_type as tdt WITH (NOLOCK) ON 
	tdt.tax_district_type_cd = td.tax_district_type_cd

GO


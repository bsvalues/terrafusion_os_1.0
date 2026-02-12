
CREATE VIEW levy_cert_const_limit_summary_vw 
AS
SELECT
	lcal.levy_cert_run_id,
	lcal.[year],
	ta.tax_area_id,
	ta.tax_area_number,
	ta.tax_area_description,
	min(cast(isnull(lcal.status, 0) as int)) as [status],
	sum(isnull(lcal.original_levy_rate, 0)) as original_levy_rate,
	sum(isnull(lcal.levy_reduction, 0)) as levy_reduction,
	sum(isnull(lcal.final_levy_rate, 0)) as final_levy_rate,
	sum(case when isnull(lcal.original_senior_levy_rate, 0) > 0 then lcal.original_senior_levy_rate else isnull(lcal.original_levy_rate, 0) end) as original_senior_levy_rate,
	sum(case when isnull(lcal.senior_levy_reduction, 0) > 0 then lcal.senior_levy_reduction else isnull(lcal.levy_reduction, 0) end) as senior_levy_reduction,
	sum(case when isnull(lcal.final_senior_levy_rate, 0) > 0 then lcal.final_senior_levy_rate else isnull(lcal.final_levy_rate, 0) end)	as final_senior_levy_rate
FROM tax_area as ta with (nolock)
JOIN tax_area_fund_assoc as tafa with (nolock) on
		ta.tax_area_id			= tafa.tax_area_id
JOIN levy_cert_const_limit as lcal with (nolock) on
		lcal.[year]				= tafa.[year]
	and lcal.tax_district_id	= tafa.tax_district_id
	and lcal.levy_cd			= tafa.levy_cd
GROUP BY
	lcal.levy_cert_run_id,
	lcal.[year],
	ta.tax_area_id,
	ta.tax_area_number,
	ta.tax_area_description

GO


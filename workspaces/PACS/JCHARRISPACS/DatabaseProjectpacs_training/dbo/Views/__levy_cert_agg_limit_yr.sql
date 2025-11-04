create view __levy_cert_agg_limit_yr as
SELECT
	lcal.levy_cert_run_id,
	lcal.[year],
	ta.tax_area_id,
	ta.tax_area_number,
	ta.tax_area_description,
	min(cast(isnull(lcal.status,0) as int))	as [status],
	sum(lcal.original_levy_rate)			as original_levy_rate,
	sum(lcal.levy_reduction)				as levy_reduction,
	sum(lcal.final_levy_rate)				as final_levy_rate
FROM tax_area as ta with (nolock)
JOIN tax_area_fund_assoc as tafa with (nolock) on
		ta.tax_area_id			= tafa.tax_area_id
JOIN levy_cert_agg_limit as lcal with (nolock) on
		lcal.[year]				= tafa.[year]
	and lcal.tax_district_id	= tafa.tax_district_id
	and lcal.levy_cd			= tafa.levy_cd
		where lcal.year=(Select appr_yr-1 from pacs_oltp.dbo.pacs_system)

GROUP BY
	lcal.levy_cert_run_id,
	lcal.[year],
	ta.tax_area_id,
	ta.tax_area_number,
	ta.tax_area_description

GO


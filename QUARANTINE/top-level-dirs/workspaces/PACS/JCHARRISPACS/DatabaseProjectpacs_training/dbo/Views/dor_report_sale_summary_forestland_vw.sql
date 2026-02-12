
create view dor_report_sale_summary_forestland_vw

as

	select
		drr.dataset_id,
		sum_assessed_value = isnull(sum(drs.assessed_value), 0),
		stratum_ratio = convert(numeric(14,6), 100),
		market_to_actual_assessed = isnull(sum(drs.assessed_value), 0)
	from dor_report_run as drr with(nolock)
	left outer join dor_report_sale as drs with(nolock) on
		drs.dataset_id = drr.dataset_id and
		drs.forestland_flag = 1
	where
		prop_type_cd = 'R' -- real properties only
	group by
		drr.dataset_id

GO


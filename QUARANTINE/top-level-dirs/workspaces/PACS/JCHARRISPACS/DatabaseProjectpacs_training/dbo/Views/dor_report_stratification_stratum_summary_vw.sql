
create view dor_report_stratification_stratum_summary_vw

as

	select
		drs.dataset_id,
		dc.group_type,
		dc.begin_value,
		dc.end_value,
		num_props = count(*),
		sum_assessed_value = sum(drs.assessed_value),
		dc.stratum_id,
		dc.year,
		prior_assessed_value = sum(drs.prior_assessed_value)
	from dor_report_stratification as drs with(nolock)
	join dor_report_config_stratum as dc with(nolock) on
		dc.stratum_id = drs.stratum_id and
		dc.[year] = drs.[year]
	where
		drs.is_sample = 1
	group by 
		drs.dataset_id,
		dc.group_type,
		dc.begin_value,
		dc.end_value,
		dc.stratum_id,
		dc.year

GO


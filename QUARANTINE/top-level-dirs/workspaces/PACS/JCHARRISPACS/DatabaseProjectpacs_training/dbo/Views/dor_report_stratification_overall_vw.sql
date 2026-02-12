
create view dor_report_stratification_overall_vw

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
		sum_prior_assessed_value = sum(drs.prior_assessed_value)
	from dor_report_stratification as drs with(nolock)
	join dor_report_config_stratum as dc with(nolock) on
		dc.stratum_id = drs.stratum_id and
		dc.[year] = drs.[year]
	where
		drs.overall_flag = 1
	group by 
		drs.dataset_id,
		dc.group_type,
		dc.begin_value,
		dc.end_value,
		dc.stratum_id,
		dc.year

UNION 	

		select
		drs.dataset_id,
		'R',
		0,
		0,
		num_props = count(*),
		sum_assessed_value = sum(drs.assessed_value),
		drs.stratum_id,
		drs.year,
		sum_prior_assessed_value = sum(drs.prior_assessed_value)
	from dor_report_stratification as drs with(nolock)	
	where
		drs.stratum_id = 111111
	group by 
		drs.dataset_id,
		drs.stratum_id,
		drs.year

UNION 	

		select
		drs.dataset_id,
		'C',
		0,
		0,
		num_props = count(*),
		sum_assessed_value = sum(drs.assessed_value),
		drs.stratum_id,
		drs.year,
		sum_prior_assessed_value = sum(drs.prior_assessed_value)
	from dor_report_stratification as drs with(nolock)	
	where
		drs.stratum_id = 222222
	group by 
		drs.dataset_id,
		drs.stratum_id,
		drs.year

UNION 	

		select
		drs.dataset_id,
		'O',
		0,
		0,
		num_props = count(*),
		sum_assessed_value = sum(drs.assessed_value),
		drs.stratum_id,
		drs.year,
		sum_prior_assessed_value = sum(drs.prior_assessed_value)
	from dor_report_stratification as drs with(nolock)	
	where
		drs.stratum_id = 333333
	group by 
		drs.dataset_id,
		drs.stratum_id,
		drs.year

UNION 	

		select
		drs.dataset_id,
		'X',
		0,
		0,
		num_props = count(*),
		sum_assessed_value = sum(drs.assessed_value),
		drs.stratum_id,
		drs.year,
		sum_prior_assessed_value = sum(drs.prior_assessed_value)
	from dor_report_stratification as drs with(nolock)	
	where
		drs.stratum_id = 444444
	group by 
		drs.dataset_id,
		drs.stratum_id,
		drs.year

UNION 	

		select
		drs.dataset_id,
		'P',
		0,
		0,
		num_props = count(*),
		sum_assessed_value = sum(drs.assessed_value),
		drs.stratum_id,
		drs.year,
		sum_prior_assessed_value = sum(drs.prior_assessed_value)
	from dor_report_stratification as drs with(nolock)	
	where
		drs.stratum_id = 555555
	group by 
		drs.dataset_id,
		drs.stratum_id,
		drs.year

GO


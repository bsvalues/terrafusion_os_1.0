
create view dor_report_stratification_other_vw

as

	select
		top 100 percent
		dataset_id, group_desc, num_props, sum_assessed_value = isnull(sum_assessed_value, 0), sum_prior_assessed_value = isnull(sum_prior_assessed_value, 0)
	from (
		select
			drr.dataset_id,
			group_desc = 'Senior Property Information',
			orderByDummy = 1,
			num_props = count(drs.prop_id),
			sum_assessed_value = sum(drs.assessed_value),
			sum_prior_assessed_value = sum(drs.prior_assessed_value)
		from dor_report_run as drr with(nolock)
		left outer join dor_report_stratification as drs with(nolock) on
			drs.dataset_id = drr.dataset_id and
			drs.senior_flag = 1
		group by 
			drr.dataset_id

		union all
		
		select
			drr.dataset_id,
			group_desc = 'Forestland Property Information',
			orderByDummy = 2,
			num_props = count(drs.prop_id),
			sum_assessed_value = sum(drs.assessed_value),
			sum_prior_assessed_value = sum(drs.prior_assessed_value)
		from dor_report_run as drr with(nolock)
		left outer join dor_report_stratification as drs with(nolock) on
			drs.dataset_id = drr.dataset_id and
			drs.forestland_flag = 1
		group by 
			drr.dataset_id

		union all
		
		select
			drr.dataset_id,
			group_desc = 'Properties Under $1,000',
			orderByDummy = 3,
			num_props = count(drs.prop_id),
			sum_assessed_value = sum(drs.assessed_value),
			sum_prior_assessed_value = sum(drs.prior_assessed_value)
		from dor_report_run as drr with(nolock)
		left outer join dor_report_stratification as drs with(nolock) on
			drs.dataset_id = drr.dataset_id and
			drs.properties_under_flag = 1
		group by 
			drr.dataset_id
	) as derivedTable
	order by dataset_id, orderByDummy

GO


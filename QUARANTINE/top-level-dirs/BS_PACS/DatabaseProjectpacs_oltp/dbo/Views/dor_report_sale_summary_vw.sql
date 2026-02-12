
create view dor_report_sale_summary_vw

as

	select
		top 100 percent
		derivedTable.*,
		drcs.begin_value,
		drcs.end_value
	from (
	
		select
			dataset_id,
			[year] = -1,
			category = 'Senior Freeze',
			orderByDummy = 1,
			stratum_id = -1,
			num_sales = null,
			sum_assessed_value,
			avg_assessed_value = null,
			avg_adjusted_sale_price = null,
			stratum_ratio,
			market_to_actual_assessed
		from dor_report_sale_summary_senior_vw
		
		union all
		
		select
			dataset_id,
			[year] = -1,
			category = 'Timber Land',
			orderByDummy = 2,
			stratum_id = -1,
			num_sales = null,
			sum_assessed_value,
			avg_assessed_value = null,
			avg_adjusted_sale_price = null,
			stratum_ratio,
			market_to_actual_assessed
		from dor_report_sale_summary_timberland_vw

		union all
		
		select
			dataset_id,
			[year] = -1,
			category = 'Forest Land',
			orderByDummy = 3,
			stratum_id = -1,
			num_sales = null,
			sum_assessed_value,
			avg_assessed_value = null,
			avg_adjusted_sale_price = null,
			stratum_ratio,
			market_to_actual_assessed
		from dor_report_sale_summary_forestland_vw

		union all
		
		select
			dataset_id,
			year,
			category = 'Single Family Residence',
			orderByDummy = 4,
			stratum_id,
			num_sales,
			sum_assessed_value,
			avg_assessed_value,
			avg_adjusted_sale_price,
			stratum_ratio,
			market_to_actual_assessed
		from dor_report_sale_summary_single_vw		

		union all

		select
			dataset_id,
			ss.year,
			category = 'Multi Family Residence, Commercial, Manufacturing',
			orderByDummy = 5,
			stratum_id,
			num_sales,
			sum_assessed_value,
			avg_assessed_value,
			avg_adjusted_sale_price,
			stratum_ratio,
			market_to_actual_assessed
		from dor_report_sale_summary_commercial_vw ss
		join dor_report_config drc
		on ss.year = drc.year
		and drc.type = 'R'
		and isnull(drc.separate_current_use_group, 0) = 1
		
		union all

		select
			dataset_id,
			ss.year,
			category = 'Agricultural Current Use, Open Space, Other',
			orderByDummy = 6,
			stratum_id,
			num_sales,
			sum_assessed_value,
			avg_assessed_value,
			avg_adjusted_sale_price,
			stratum_ratio,
			market_to_actual_assessed
		from dor_report_sale_summary_multi_vw ss
		join dor_report_config drc
		on ss.year = drc.year
		and drc.type = 'R'
		and isnull(drc.separate_current_use_group, 0) = 1
		
		union all

		select
			dataset_id,
			ss.year,
			category = 'Multi Family Residence, Commercial, Manufacturing, Agricultural Current Use, Open Space, Other',
			orderByDummy = 7,
			stratum_id,
			num_sales,
			sum_assessed_value,
			avg_assessed_value,
			avg_adjusted_sale_price,
			stratum_ratio,
			market_to_actual_assessed
		from dor_report_sale_summary_multi_vw ss
		join dor_report_config drc
		on ss.year = drc.year
		and drc.type = 'R'
		and isnull(drc.separate_current_use_group, 0) = 0

	) as derivedTable
	left outer join dor_report_config_stratum as drcs with(nolock) on
		drcs.[year] = derivedTable.[year]
		and drcs.[type] = 'R'
		and drcs.stratum_id = derivedTable.stratum_id
	order by derivedTable.dataset_id, derivedTable.orderByDummy

GO


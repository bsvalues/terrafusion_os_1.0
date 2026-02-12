
create view dor_report_sale_summary_valuesums_vw

as

	select
		derivedTable.dataset_id,
		total_assessed_value = sum(isnull(derivedTable.sum_assessed_value, 0)),
		total_market_to_actual_assessed = sum(isnull(derivedTable.market_to_actual_assessed, 0)),
		total_ratio = convert(
			numeric(14,6),
			case
				when sum(isnull(derivedTable.market_to_actual_assessed, 0)) > 0
				then
					sum(isnull(derivedTable.sum_assessed_value, 0))
					/
					sum(isnull(derivedTable.market_to_actual_assessed, 0))
				else 0
			end
		)
	from (
	
		select
			dataset_id, sum_assessed_value, market_to_actual_assessed
		from dor_report_sale_summary_senior_vw
		
		union
		
		select
			dataset_id, sum_assessed_value, market_to_actual_assessed
		from dor_report_sale_summary_timberland_vw

		union
		
		select
			dataset_id, sum_assessed_value, market_to_actual_assessed
		from dor_report_sale_summary_forestland_vw

		union
		
		select
			dataset_id, sum_assessed_value, market_to_actual_assessed
		from dor_report_sale_summary_multi_vw

		union
		
		select
			dataset_id, sum_assessed_value, market_to_actual_assessed
		from dor_report_sale_summary_single_vw

	) as derivedTable

	group by
		derivedTable.dataset_id

GO


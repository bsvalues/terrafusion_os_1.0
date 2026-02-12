
create view dor_report_sale_summary_salecounts_vw

as

	select
		derivedTable.dataset_id,
		total_num_sales = sum(isnull(derivedTable.num_sales, 0))
	from (
	
		select
			dataset_id, num_sales
		from dor_report_sale_summary_multi_vw
		
		union
		
		select
			dataset_id, num_sales
		from dor_report_sale_summary_single_vw

	) as derivedTable

	group by
		derivedTable.dataset_id

GO


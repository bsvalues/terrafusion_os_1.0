
create view dor_report_sale_detail_vw

as

	select
		drs.dataset_id,
		drs.chg_of_owner_id,
		drcs.[year],
		drs.stratum_id,
		drs.reet_number,
		drspa.prop_id,
		drs.sale_date,
		drs.sale_price,
		drs.adjusted_sale_price,
		drs.dor_land_use_code,
		drs.assessed_value,
		drs.sale_ratio,
		drs.invalid_sales_code,
		drs.invalid_reason,
		
		orderByDummy = case 
			when drs.prop_type_cd = 'R' and drcs.group_type = 'R' then 1 
			when drs.prop_type_cd = 'R' and drcs.group_type = 'C' then 2 
			when drs.prop_type_cd = 'R' and drcs.group_type = 'O' then 3 
			when drs.prop_type_cd <> 'R' and drcs.group_type = 'R' then 4 
			when drs.prop_type_cd <> 'R' and drcs.group_type = 'C' then 5 
			when drs.prop_type_cd <> 'R' and drcs.group_type = 'O' then 6 
			else 4 end,
			
		drcs.begin_value,
		pt.prop_type_desc
		
	from dor_report_sale as drs with(nolock)
	join dor_report_sale_prop_assoc as drspa with(nolock) on
		drspa.dataset_id = drs.dataset_id and
		drspa.chg_of_owner_id = drs.chg_of_owner_id
	left outer join dor_report_config_stratum as drcs with(nolock) on
		drcs.stratum_id = drs.stratum_id and
		drcs.[year] = drspa.[year]
	left outer join property_type pt with(nolock) on
		drs.prop_type_cd = pt.prop_type_cd

GO


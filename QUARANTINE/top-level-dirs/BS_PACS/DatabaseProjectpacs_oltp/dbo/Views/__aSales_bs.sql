create view __aSales_bs as

SELECT 
chg_of_owner_prop_assoc.prop_id, 
sale.sl_price,  sale.sl_ratio_type_cd, 
sale.sl_county_ratio_cd, 
convert(char(20), sl_dt, 101) as sl_dt,	 
sale.adjusted_sl_price
,sale.chg_of_owner_id
,sale.land_only_sale,
sale.sl_qualifier,
sale.sl_land_unit_price
,sale.sl_class_cd
,sale.sl_imprv_unit_price
,sale.sl_type_cd
,sale.pers_prop_val
,sale.sl_adj_rsn
,sale.sl_land_type_cd
,sale.continue_current_use,
convert(char(20), chg_of_owner.recorded_dt, 101)	as recorded_dt,
chg_of_owner.comment    as  chg_comment,
chg_of_owner.deed_type_cd,
ROW_NUMBER()over (partition by chg_of_owner_prop_assoc.prop_id ORDER BY sl_dt DESC) AS order_id
,reet.[reet_id]
,reet.[excise_number]	
,reet.instrument_type_cd, 
reet.pers_prop_included, 
reet.pers_prop_val as ppv, 
reet.pers_prop_description, 
reet.exemption_claimed, 
reet.wac_number_type_cd, 
reet.wac_reason, 
reet.tax_area_id, 
reet.urban_growth_cd, 
reet.exemption_amount, 
reet.agency_id, 
reet.imp_manual_entry, 
reet.imp_partial_sale, 
reet.imp_continuance_flag, 
reet.imp_historic_flag, 
reet.imp_open_space_flag, 
reet.imp_city, 
reet.imp_current_use_flag, 
reet.imp_unique_identifier, 
reet.comment
	FROM [pacs_oltp].[dbo].sale
left JOIN 
	[pacs_oltp].[dbo].chg_of_owner_prop_assoc 
		ON sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id

left join 
	[pacs_oltp].[dbo].chg_of_owner
		on chg_of_owner.chg_of_owner_id=chg_of_owner_prop_assoc.chg_of_owner_id
left join [pacs_oltp].[dbo].reet_chg_of_owner_assoc  rcoa
        ON rcoa.chg_of_owner_id = chg_of_owner.chg_of_owner_id 

INNER JOIN  reet 
		ON rcoa.reet_id = reet.reet_id

left join 	[pacs_oltp].[dbo].sales_mult_prop_val_vw 		
		ON chg_of_owner.chg_of_owner_id = sales_mult_prop_val_vw.chg_of_owner_id 
		
		where chg_of_owner_prop_assoc.chg_of_owner_id IS NOT NULL AND sl_price > 0

GO


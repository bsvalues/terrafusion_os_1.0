--Sales Sub query

Create view AP_Sales as

SELECT
chg_of_owner_prop_assoc.prop_id
, sale.sl_price
,  sale.sl_ratio_type_cd
, sale.sl_county_ratio_cd
, convert(char(20), sl_dt, 101)AS SaleDate--sale.sl_dt
,sale.adjusted_sl_price
,sale.chg_of_owner_id
,sale.land_only_sale
,sale.sl_qualifier
,sale.sl_land_unit_price
,sale.sl_class_cd 
,sale.sl_imprv_unit_price
,sale.sl_type_cd
,sale.pers_prop_val
,sale.sl_adj_rsn
,sale.sl_land_type_cd
,sale.continue_current_use
,chg_of_owner.excise_number
,convert(char(20), chg_of_owner.recorded_dt, 101)as  'recorded_dt'  
,chg_of_owner.comment
,sale.wac_cd
,chg_of_owner.deed_type_cd
,sale.exemption_amount
,sale.sl_ratio_cd_reason
,chg_of_owner.consideration
,chg_of_owner.deed_num
,chg_of_owner.deed_book_page
,sale.include_reason
,sale.frozen_characteristics
,ROW_NUMBER()over (partition by chg_of_owner_prop_assoc.prop_id ORDER BY sl_dt DESC) AS order_id

FROM 
[pacs_oltp].[dbo].sale

left JOIN 
	[pacs_oltp].[dbo].chg_of_owner_prop_assoc 
ON 
	sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id

left join 
	[pacs_oltp].[dbo].chg_of_owner
on	
	chg_of_owner.chg_of_owner_id=chg_of_owner_prop_assoc.chg_of_owner_id

left join 	
	[pacs_oltp].[dbo].sales_mult_prop_val_vw 		
ON 
	chg_of_owner.chg_of_owner_id = sales_mult_prop_val_vw.chg_of_owner_id 
	
where 

chg_of_owner_prop_assoc.chg_of_owner_id IS NOT NULL AND sl_price > 0

GO


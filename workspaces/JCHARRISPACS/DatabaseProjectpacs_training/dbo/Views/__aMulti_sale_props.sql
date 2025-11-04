
create view __aMulti_sale_props as
SELECT chg_of_owner_prop_assoc.prop_id, 
sale.sl_price,  sale.sl_ratio_type_cd, 
sale.sl_county_ratio_cd, sale.sl_dt, 
sale.adjusted_sl_price,
sale.chg_of_owner_id,
sale.land_only_sale,
			sale.sl_qualifier,
			sale.sl_land_unit_price,
			sale.sl_class_cd,
			sale.sl_imprv_unit_price,sale.sl_type_cd,
			sale.pers_prop_val,
			sale.sl_adj_rsn,
			sale.sl_land_type_cd,
			chg_of_owner.excise_number,
			chg_of_owner.deed_type_cd,ROW_NUMBER()over (partition by chg_of_owner_prop_assoc.prop_id ORDER BY sl_dt DESC) AS order_id
				FROM sale
left JOIN 
	chg_of_owner_prop_assoc 
		ON sale.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id
left join 
	chg_of_owner
		on chg_of_owner.chg_of_owner_id=chg_of_owner_prop_assoc.chg_of_owner_id
left join 	sales_mult_prop_val_vw 		
ON chg_of_owner.chg_of_owner_id = sales_mult_prop_val_vw.chg_of_owner_id 

where chg_of_owner_prop_assoc.chg_of_owner_id IS NOT NULL AND sl_price > 0

GO


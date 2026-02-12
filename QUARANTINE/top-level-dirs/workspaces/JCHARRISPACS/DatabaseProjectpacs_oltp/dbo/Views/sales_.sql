create view sales_ as

SELECT        
chg_of_owner_prop_assoc.prop_id, sale.sl_ratio, sale.sl_financing_cd, sale.sl_ratio_type_cd, sale.sl_adj_cd, sale.sl_type_cd,
sale.sl_state_cd, sale.sl_class_cd, sale.sl_price, 
CASE WHEN (CONVERT(date, sale.sl_dt, 101)) IS NULL				THEN '' ELSE (CONVERT(date, sale.sl_dt, 101)) END AS sl_dt, 
CASE WHEN (CONVERT(date, chg_of_owner.deed_dt, 101)) IS NULL	THEN '' ELSE (CONVERT(date, chg_of_owner.deed_dt, 101))END AS deed_dt, 
sale.adjusted_sl_price AS adjusted_sale_price, 
sale.suppress_on_ratio_rpt_cd AS ratio_code, 
sale.suppress_on_ratio_rsn, 
sale.sl_adj_sl_pct, 
sale.sl_adj_sl_amt, 
sale.sl_adj_rsn, 
sale.sl_comment, 
chg_of_owner.chg_of_owner_id, 
chg_of_owner.deed_type_cd, 
chg_of_owner.deed_num, 
chg_of_owner.deed_book_id AS book_id, 
chg_of_owner.deed_book_page AS book_page, 
chg_of_owner.consideration, 
chg_of_owner.comment, 
sales_mult_prop_val_vw.prop_count AS multi_prop_count, 
sales_mult_prop_val_vw.total_land_market AS mp_totalLandMarket, 
sales_mult_prop_val_vw.total_imp_market AS mp_totalImpMarket, 
sales_mult_prop_val_vw.total_market AS mp_totalMarket,
sales_mult_prop_val_vw.sup_tax_yr AS mp_sup_tax_year,
sales_mult_prop_val_vw.total_acres AS mp_total_aces 
,XCoord,YCoord
FROM  chg_of_owner 
INNER JOIN
 sale 
 ON chg_of_owner.chg_of_owner_id = sale.chg_of_owner_id INNER JOIN
                         chg_of_owner_prop_assoc ON chg_of_owner.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id LEFT OUTER JOIN
                         sales_mult_prop_val_vw ON chg_of_owner.chg_of_owner_id = sales_mult_prop_val_vw.chg_of_owner_id LEFT OUTER JOIN
                         sale_conf ON sale.chg_of_owner_id = sale_conf.chg_of_owner_id
						inner join 
	(SELECT [Parcel_ID],ROW_NUMBER() over (partition by prop_id ORDER BY [OBJECTID] DESC) AS order_id,[Prop_ID],shape, [Shape].STCentroid().STX as XCoord,[Shape].STCentroid().STY as YCoord 
		FROM [Benton_spatial_data].[dbo].[parcel]) as coords
			ON chg_of_owner_prop_assoc.prop_id = coords.Prop_ID AND coords.order_id = 1
			where sl_dt>'2017-01-01'

GO


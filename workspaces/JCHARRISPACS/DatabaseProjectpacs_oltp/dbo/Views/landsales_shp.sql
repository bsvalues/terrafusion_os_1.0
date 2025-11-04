create view landsales_shp as

SELECT        chg_of_owner_prop_assoc.prop_id as ParcelID,
 pv.cycle, pv.hood_cd as neighborhood,
 sale.sl_ratio_type_cd , 
sale.land_only_sale as land_only,
 sale.sl_adj_cd, 
sale.sl_type_cd, sale.sl_state_cd,
 sale.sl_class_cd, 
sale.sl_price as OriginalSalePrice, 
pv.appraised_val as TotalAppraised,
pv.assessed_val as TotalAssessed,
pv.market as TotalMarket,


CASE WHEN (CONVERT(varchar(10), sale.sl_dt, 101)) IS NULL 
                         THEN '' ELSE (CONVERT(varchar(10), 
						 sale.sl_dt, 101)) END AS SaleDate, 
						 CASE WHEN (CONVERT(varchar(10), chg_of_owner.deed_dt, 101)) IS NULL THEN '' ELSE (CONVERT(varchar(10), 
						 chg_of_owner.deed_dt, 101)) END AS deed_dt,
						  sale.adjusted_sl_price AS adjusted_sale_price, 
					sale.primary_use_cd, 
					sale.continue_current_use, 
					sale.sl_ratio_cd_reason, sale.sales_exclude_calc_cd, sale.sl_exported_flag,sale.sl_land_sqft as TotalLand,sale.sl_land_acres TotalLandAcres, sale.sl_land_unit_price,

						 sale.suppress_on_ratio_rpt_cd AS ratio_code, 
						 sale.suppress_on_ratio_rsn, 
                       
						 sale.sl_comment, 
						 chg_of_owner.chg_of_owner_id, 
						 chg_of_owner.deed_type_cd as Deed_type, 
						 chg_of_owner.deed_num as Deed_Number, 
						 chg_of_owner.deed_book_id AS book, 
                         chg_of_owner.deed_book_page AS BookPage,
						  chg_of_owner.consideration, 
						 chg_of_owner.comment, 
						 chg_of_owner.deed_type_cd,
						 chg_of_owner.excise_number,
			
					
						  sales_mult_prop_val_vw.prop_count AS multi_prop_count, 
                         sales_mult_prop_val_vw.total_land_market AS mp_totalLandMarket, 
						 sales_mult_prop_val_vw.total_imp_market AS mp_totalImpMarket,
						  sales_mult_prop_val_vw.total_market AS mp_totalMarket, 
                         sales_mult_prop_val_vw.sup_tax_yr AS mp_sup_tax_year, 
						 sales_mult_prop_val_vw.total_acres AS mp_total_aces 
						,XCoord,YCoord, shape
FROM            chg_of_owner INNER JOIN
                         sale ON chg_of_owner.chg_of_owner_id = sale.chg_of_owner_id INNER JOIN
                         chg_of_owner_prop_assoc ON chg_of_owner.chg_of_owner_id = chg_of_owner_prop_assoc.chg_of_owner_id LEFT OUTER JOIN
                         sales_mult_prop_val_vw ON chg_of_owner.chg_of_owner_id = sales_mult_prop_val_vw.chg_of_owner_id LEFT OUTER JOIN
                         sale_conf ON sale.chg_of_owner_id = sale_conf.chg_of_owner_id
						inner join 
						property_val pv on pv.prop_id=chg_of_owner_prop_assoc.prop_id
						inner join
(SELECT 
[Parcel_ID],
ROW_NUMBER() 
over 
(partition by prop_id 
ORDER BY [Prop_ID] DESC) 
AS order_id,
[Prop_ID],
[shape],
[shape].STCentroid().STX as XCoord,
[shape].STCentroid().STY as YCoord 

FROM 
[Benton_spatial_data].[dbo].[Parcel]
) as sp on sp.Prop_ID=chg_of_owner_prop_assoc.prop_id
where sl_dt>'01/01/2014'
and sale.sl_ratio_type_cd='00'
and land_only_sale is not null

GO


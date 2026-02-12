

create view [dbo].[_Comp_Sales_land] as
select  pv.prop_id,

pv.market,
	sale.sl_ratio_type_cd,
	
	sale.sl_price,
	convert(varchar (20), sl_dt, 101)as SaleDate,
	sale.adjusted_sl_price,
	sale.sl_adj_sl_pct,
	sale.sl_adj_sl_amt,
	sale.sl_adj_rsn,
	sale.chg_of_owner_id,
	comp_sales_land_mult_prop_vw.total_land_market,
	comp_sales_land_mult_prop_vw.prop_val_yr,
	comp_sales_land_mult_prop_vw.max_land_market,
	comp_sales_land_mult_prop_vw.total_acres,
	comp_sales_land_mult_prop_vw.total_square_feet,
	comp_sales_land_mult_prop_vw.total_useable_acres,
	comp_sales_land_mult_prop_vw.total_useable_square_feet,
	comp_sales_land_mult_prop_vw.total_front_feet,
	comp_sales_land_mult_prop_vw.total_num_units,
	isnull(sale.land_only_sale, 0) as land_only_sale,
	comp_sales_land_mult_prop_vw.prop_count,
	sale.sl_county_ratio_cd,sale.sl_type_cd

from sale with(nolock)
join comp_sales_land_mult_prop_vw with(nolock) on
	sale.chg_of_owner_id = comp_sales_land_mult_prop_vw.chg_of_owner_id
	inner join chg_of_owner co on co.chg_of_owner_id=sale.chg_of_owner_id
	inner join chg_of_owner_prop_assoc copa on copa.chg_of_owner_id=co.chg_of_owner_id
	inner join property_val pv on pv.prop_id=copa.prop_id
	where pv.prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO


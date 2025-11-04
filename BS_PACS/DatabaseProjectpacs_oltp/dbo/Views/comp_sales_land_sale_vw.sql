
create view dbo.comp_sales_land_sale_vw
as
select
	sale.sl_ratio_type_cd,
	sale.sl_type_cd,
	sale.sl_price,
	sale.sl_dt,
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
	sale.sl_county_ratio_cd

from sale with(nolock)
join comp_sales_land_mult_prop_vw with(nolock) on
	sale.chg_of_owner_id = comp_sales_land_mult_prop_vw.chg_of_owner_id

GO




CREATE view [dbo].[collin_sales_map_vw]

as

select p.prop_id		as prop_id,
       p.geo_id			as geo_id,
       convert(varchar (20), sl_dt, 101) as sale_dt,
       sale.adjusted_sl_price   as sale_price,
       pp.class_cd    		as class_cd,
       pp.living_area 		as living_area,
       yr_blt         		as actual_yr_blt,
       eff_yr_blt     		as eff_yr_blt,
       case when IsNull(sale.adjusted_sl_price, 0) > 0 then pv.market/sale.adjusted_sl_price else 0 end as sales_ratio
       ,sale.sl_county_ratio_cd,sale.sl_ratio_type_cd
       
from sale with (nolock),
     chg_of_owner_prop_assoc copa  with (nolock),
     prop_supp_assoc psa with (nolock),
     property_val pv with (nolock),
     property_profile pp with (nolock),
     property p  with (nolock) 
where sale.chg_of_owner_id   = copa.chg_of_owner_id
and   copa.prop_id   = pv.prop_id
and   pv.prop_id     = psa.prop_id
and   pv.sup_num     = psa.sup_num
and   pv.prop_val_yr = psa.owner_tax_yr
and   pv.prop_id     = pp.prop_id
and   pv.sup_num     = pp.sup_num
and   pv.prop_val_yr = pp.prop_val_yr
and   pv.prop_id     = p.prop_id
and   pv.prop_val_yr =(select appr_yr from pacs_oltp.dbo.pacs_system)

GO


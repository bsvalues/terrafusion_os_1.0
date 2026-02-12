select distinct pv.prop_id, p.geo_id, ld.land_type_cd,
ld.state_cd, ld.size_acres, ld.size_square_feet, 
ld.mkt_val_source, ld.land_seg_mkt_val, ld.mkt_flat_val, 
ld.mkt_adj_val, ta.tax_area_number
from property_val pv with (nolock)
inner join prop_supp_assoc psa with (nolock) on
pv.prop_id = psa.prop_id
and pv.prop_val_yr = psa.owner_tax_yr
and pv.sup_num = psa.sup_num
inner join property p with (nolock) on
pv.prop_id = p.prop_id 
inner join land_detail ld with (nolock) on
pv.prop_id = ld.prop_id
and pv.prop_val_yr = ld.prop_val_yr
and pv.sup_num = ld.sup_num
and ld.sale_id = 0
inner join property_tax_area pta with (nolock) on
pv.prop_id = pta.prop_id
and pv.prop_val_yr = pta.year
and pv.sup_num = pta.sup_num
inner join tax_area ta with (nolock) on
pta.tax_area_id = ta.tax_area_id
and ta.tax_area_number not like '1%'
where pv.prop_val_yr = (select tax_yr from pacs_system)---you can change the year as needed
and pv.prop_inactive_dt is null
and pv.prop_id not in (select prop_id
from property_exemption
where exmpt_tax_yr = (select tax_yr from pacs_system)---change year to match the above year
and exmpt_type_cd in ('snr/dsbl', 'ex'))
order by ta.tax_area_number, p.geo_id



create view [dbo].[collin_field_review_map_vw]

as

select p.prop_id      as prop_id, 
       p.geo_id       as geo_id, 
       pp.class_cd    as class_cd,
       pp.living_area as living_area,
       yr_blt         as actual_yr_blt,
       eff_yr_blt     as eff_yr_blt
       
from property_profile pp with (nolock),
     property_val pv     with (nolock),
     prop_supp_assoc psa with (nolock),
     property p		 with (nolock)
where psa.prop_id      = pp.prop_id
and   psa.sup_num      = pp.sup_num
and   psa.owner_tax_yr = pp.prop_val_yr
and   pp.prop_id       = pv.prop_id
and   pp.sup_num       = pv.sup_num
and   pp.prop_val_yr   = pv.prop_val_yr
and   pv.prop_val_yr   = (select appr_yr from pacs_oltp.dbo.pacs_system)
and   pv.prop_inactive_dt is null
and   pv.prop_id       = p.prop_id

GO


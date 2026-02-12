
CREATE  view land_entity_assoc_vw as

select i.prop_id, i.sup_num, i.prop_val_yr, i.land_seg_id, i.sale_id,
e.entity_cd,
IsNull(case when iea.entity_pct is null then epa.entity_prop_pct else iea.entity_pct end, 100) as entity_pct
from land_detail i
inner join entity_prop_assoc epa 
on  epa.prop_id = i.prop_id
and epa.sup_num = i.sup_num
and epa.tax_yr  = i.prop_val_yr
inner join entity e 
on  epa.entity_id = e.entity_id
left outer join land_entity_assoc iea
on  i.prop_id = iea.prop_id
and i.sup_num = iea.sup_num
and i.prop_Val_yr = iea.prop_Val_yr
and i.land_seg_id = iea.land_seg_id
and epa.entity_id = iea.entity_id

GO


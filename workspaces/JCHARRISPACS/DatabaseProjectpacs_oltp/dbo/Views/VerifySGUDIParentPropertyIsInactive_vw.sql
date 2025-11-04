
create view VerifySGUDIParentPropertyIsInactive_vw
as
select pv.prop_val_yr,pv.prop_id,pv.sup_num,s.sup_group_id,pv.prop_inactive_dt 
from property_val as pv with (nolock)

inner JOIN supplement as s with(nolock) 
on pv.sup_num = s.sup_num AND pv.prop_val_yr = s.sup_tax_yr 

where isnull(udi_parent,'F') = 'T' and prop_inactive_dt is null

GO


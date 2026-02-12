
create procedure sp_FixSupActionPerSupGroup
	@sup_group_id as int
as

-- This should fix properties with bad sup_action that should be 'A'
-- this is for a property that was deleted and then un-deleted
update property_val set sup_action ='A'
from property_val

inner join supplement as s with (nolock) 
on property_val.sup_num = s.sup_num AND property_val.prop_val_yr = s.sup_tax_yr

inner join property_val as ppv with (nolock) on
property_val.prop_id = ppv.prop_id and
property_val.prop_val_yr = ppv.prop_val_yr and
property_val.prev_sup_num = ppv.sup_num

where property_val.sup_num > 0 and IsNull(property_val.sup_action, '') not in ('A','M','D')
and ppv.prop_inactive_dt is not null and sup_group_id = @sup_group_id


-- This should fix properties with bad sup_action that should be 'A'
-- this update is for new properties added to supplement
update property_val set sup_action ='A'
from property_val

inner join supplement as s with (nolock) 
on property_val.sup_num = s.sup_num AND property_val.prop_val_yr = s.sup_tax_yr

left outer join property_val as ppv with (nolock) on
property_val.prop_id = ppv.prop_id and
property_val.prop_val_yr = ppv.prop_val_yr and
property_val.prev_sup_num = ppv.sup_num

where property_val.sup_num > 0 and IsNull(property_val.sup_action, '') not in ('A','M','D')
and ppv.prop_id is null and sup_group_id = @sup_group_id

-- This should fix properties with bad sup_action that should be 'D'
update property_val set sup_action ='D'
from property_val

inner join supplement as s with (nolock) 
on property_val.sup_num = s.sup_num AND property_val.prop_val_yr = s.sup_tax_yr

inner join property_val as ppv with (nolock) on
property_val.prop_id = ppv.prop_id and
property_val.prop_val_yr = ppv.prop_val_yr and
property_val.prev_sup_num = ppv.sup_num

where property_val.sup_num > 0 and IsNull(property_val.sup_action, '') not in ('A','M','D')
and ppv.prop_inactive_dt is null and property_val.prop_inactive_dt is not null and sup_group_id = @sup_group_id


-- This should fix properties with bad sup_action that should be 'M'
update property_val set sup_action ='M'
from property_val

inner join supplement as s with (nolock) 
on property_val.sup_num = s.sup_num AND property_val.prop_val_yr = s.sup_tax_yr

inner join property_val as ppv with (nolock) on
property_val.prop_id = ppv.prop_id and
property_val.prop_val_yr = ppv.prop_val_yr and
property_val.prev_sup_num = ppv.sup_num

where property_val.sup_num > 0 and IsNull(property_val.sup_action, '') not in ('A','M','D')
and sup_group_id = @sup_group_id

GO


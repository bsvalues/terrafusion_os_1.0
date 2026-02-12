




create view dbo.freeze_tax_rate
as
select distinct 
	prop_owner_entity_val.entity_id, 
	prop_owner_entity_val.sup_yr, 
	prop_owner_entity_val.frz_tax_rate
from
	prop_supp_assoc with (nolock)
inner join
	prop_owner_entity_val with (nolock)
on 
	prop_supp_assoc.prop_id = prop_owner_entity_val.prop_id
and	prop_supp_assoc.owner_tax_yr = prop_owner_entity_val.sup_yr
and	prop_supp_assoc.sup_num = prop_owner_entity_val.sup_num
inner join property_freeze with (nolock)
on
	prop_supp_assoc.prop_id = property_freeze.prop_id
and	prop_supp_assoc.owner_tax_yr = property_freeze.owner_tax_yr
and	prop_supp_assoc.owner_tax_yr = property_freeze.exmpt_tax_yr
and	prop_supp_assoc.sup_num = property_freeze.sup_num
and	property_freeze.use_freeze = 'T'

GO


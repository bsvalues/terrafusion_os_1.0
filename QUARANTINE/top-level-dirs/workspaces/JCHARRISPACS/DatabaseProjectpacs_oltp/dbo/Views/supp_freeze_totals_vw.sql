




create view dbo.supp_freeze_totals_vw
as
select
	sum(prop_owner_entity_val.frz_taxable_val) as taxable_val, 
	sum(prop_owner_entity_val.frz_assessed_val) as assessed_val,
	prop_owner_entity_val.entity_id, 
	prop_owner_entity_val.sup_yr, 
	count(property_freeze.prop_id) as freeze_count,
	sum(property_freeze.freeze_ceiling) as freeze_ceiling,
	sum(prop_owner_entity_val.frz_actual_tax) as frz_actual_tax, 
	freeze_tax_rate.frz_tax_rate, 
	property_freeze.owner_tax_yr,
	property_freeze.sup_num
from
	prop_owner_entity_val
inner join
	freeze_tax_rate
on 
	prop_owner_entity_val.entity_id = freeze_tax_rate.entity_id
and	prop_owner_entity_val.sup_yr = freeze_tax_rate.sup_yr
inner join
	property_freeze with (nolock)
on
	prop_owner_entity_val.prop_id = property_freeze.prop_id
and	prop_owner_entity_val.owner_id = property_freeze.owner_id
and	prop_owner_entity_val.sup_yr = property_freeze.owner_tax_yr
and	prop_owner_entity_val.sup_num = property_freeze.sup_num
and	isnull(property_freeze.use_freeze, 'F') = 'T'
and	property_freeze.freeze_yr is not null
and	property_freeze.freeze_ceiling is not null
and	property_freeze.freeze_yr <= prop_owner_entity_val.sup_yr
inner join
	property_val
on 
	property_freeze.prop_id = property_val.prop_id
and	property_freeze.exmpt_tax_yr = property_val.prop_val_yr
and	property_freeze.sup_num = property_val.sup_num
and	property_val.prop_inactive_dt is null
group by
	prop_owner_entity_val.entity_id, 
	prop_owner_entity_val.sup_yr,
	freeze_tax_rate.frz_tax_rate, 
	property_freeze.owner_tax_yr,
	property_freeze.sup_num

GO


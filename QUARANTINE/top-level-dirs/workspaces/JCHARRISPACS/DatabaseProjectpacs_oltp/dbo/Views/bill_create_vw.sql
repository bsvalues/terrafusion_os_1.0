
CREATE view dbo.bill_create_vw
as
select
	owner.prop_id,
	owner.owner_id,
	owner.pct_ownership, 
	entity_prop_assoc.entity_prop_pct, 
	prop_owner_entity_val.assessed_val, 
	prop_owner_entity_val.imprv_hstd_val, 
	prop_owner_entity_val.imprv_non_hstd_val,
	prop_owner_entity_val.land_hstd_val, 
	prop_owner_entity_val.land_non_hstd_val,
	prop_owner_entity_val.ag_use_val, 
	prop_owner_entity_val.timber_use,
	prop_owner_entity_val.ten_percent_cap, 
	prop_owner_entity_val.taxable_val,
	property.prop_type_cd,
	entity_prop_assoc.entity_id, 
	entity_prop_assoc.sup_num,
	entity_prop_assoc.tax_yr, 
	prop_owner_entity_val.freeze_yr,
	prop_owner_entity_val.freeze_ceiling,
	case when prop_owner_entity_val.freeze_type in ('OV65', 'DP','OV65S') then 'T' else 'F' end as use_freeze,
	levy_supp_assoc.type, 
	property_val.vit_flag,
	property_val.ag_late_loss,
	property.col_owner_id
from
	entity_prop_assoc
inner join
	property_val
on 
	entity_prop_assoc.prop_id = property_val.prop_id
and	entity_prop_assoc.sup_num = property_val.sup_num
and	entity_prop_assoc.tax_yr = property_val.prop_val_yr
inner join
	owner
on
	property_val.prop_id = owner.prop_id
and
	property_val.sup_num = owner.sup_num
and	property_val.prop_val_yr = owner.owner_tax_yr
inner join
	tax_rate
on 
	entity_prop_assoc.entity_id = tax_rate.entity_id
and	entity_prop_assoc.tax_yr = tax_rate.tax_rate_yr
inner join
	prop_owner_entity_val
on 
	owner.prop_id = prop_owner_entity_val.prop_id
and	owner.owner_id = prop_owner_entity_val.owner_id
and	owner.sup_num = prop_owner_entity_val.sup_num
and	owner.owner_tax_yr = prop_owner_entity_val.sup_yr
and	entity_prop_assoc.entity_id = prop_owner_entity_val.entity_id
inner join
	levy_supp_assoc
on 
	property_val.prop_id = levy_supp_assoc.prop_id
and	property_val.prop_val_yr = levy_supp_assoc.sup_yr
and	property_val.sup_num = levy_supp_assoc.sup_num
inner join
	property
on 
	levy_supp_assoc.prop_id = property.prop_id

where
	tax_rate.collect_option <> 'N'
and	property_val.prop_inactive_dt is null

GO



create view dbo.transfer_freeze_vw
as
select
	prop_supp_assoc.prop_id, 
	prop_supp_assoc.owner_tax_yr,
	prop_supp_assoc.sup_num, 
	property_val.land_hstd_val,
	property_val.land_non_hstd_val, 
	property_val.imprv_hstd_val, 
	property_val.imprv_non_hstd_val,
	property_val.appraised_val, 
	property_val.assessed_val,
	property_val.market, 
	property_val.ag_use_val,
	property_val.ag_market, 
	property_val.ag_loss,
	property_val.ag_late_loss, 
	property_val.timber_78,
	property_val.timber_market, 
	property_val.timber_use,
	property_val.timber_loss, 
	property_val.timber_late_loss,
	entity_prop_assoc.entity_id, 
	property_freeze.owner_id, 
	property_freeze.exmpt_type_cd, 
	property_freeze.use_freeze, 
	property_freeze.transfer_dt, 
	property_freeze.prev_tax_due, 
	property_freeze.prev_tax_nofrz, 
	property_freeze.freeze_yr, 
	property_freeze.freeze_ceiling, 
	property_freeze.transfer_pct, 
	property_freeze.transfer_pct_override, 
	property_freeze.freeze_override,
	owner.pct_ownership,
	entity_prop_assoc.entity_prop_pct, 
	tax_rate.m_n_o_tax_pct,
	tax_rate.i_n_s_tax_pct, 
	entity.entity_type_cd,
	property_val.ten_percent_cap, 
	property.prop_type_cd
from
	entity_prop_assoc
inner join
	property_val
on 
	entity_prop_assoc.prop_id = property_val.prop_id
and	entity_prop_assoc.tax_yr = property_val.prop_val_yr
and	entity_prop_assoc.sup_num = property_val.sup_num
inner join
	prop_supp_assoc
on 
	property_val.prop_id = prop_supp_assoc.prop_id
and	property_val.prop_val_yr = prop_supp_assoc.owner_tax_yr
and	property_val.sup_num = prop_supp_assoc.sup_num
inner join
	owner
on
	property_val.prop_id = owner.prop_id
and	property_val.prop_val_yr = owner.owner_tax_yr
and	property_val.sup_num = owner.sup_num
inner join
	property_freeze
on
	owner.owner_id = property_freeze.owner_id
and	owner.prop_id = property_freeze.prop_id
and	owner.owner_tax_yr = property_freeze.owner_tax_yr
and	owner.sup_num = property_freeze.sup_num
inner join
	tax_rate
on 
	entity_prop_assoc.entity_id = tax_rate.entity_id
and	entity_prop_assoc.tax_yr = tax_rate.tax_rate_yr
inner join
	entity
on
	tax_rate.entity_id = entity.entity_id
inner join
	property
on 
	prop_supp_assoc.prop_id = property.prop_id
where
	property_freeze.use_freeze = 'T'
and	property_freeze.transfer_dt is not null

GO


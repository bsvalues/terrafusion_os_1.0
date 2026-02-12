

create view dbo.supplement_roll_vw
as
select distinct 
	sup_group.sup_group_id, 
	property_val.assessed_val as current_val, 
	property_val1.assessed_val as previous_val, 
	owner.pct_ownership, account.file_as_name as owner_name, 
	property_val.prop_id, property_val.prop_val_yr, 
	property_val.legal_desc, property_val.sup_cd, 
	property_val.sup_desc, property_val.sup_dt, 
	property_val.sup_action, sup_group.sup_create_dt, 
	sup_group.sup_arb_ready_dt, sup_group.sup_accept_dt, 
	sup_group.sup_bill_create_dt, sup_group.status_cd, 
	supp_status.status_cd as expr1, supp_status.status_desc, 
	supplement.sup_tax_yr, supplement.sup_num, 
	owner.owner_id, 
	pacs_user1.pacs_user_name as accepted_by, 
	pacs_user1.pacs_user_name as bills_created_by, 
	property_val.land_hstd_val as cur_land_hstd_val, 
	property_val.land_non_hstd_val as cur_land_non_hstd_val, 
	property_val.imprv_hstd_val as cur_imprv_hstd_val, 
	property_val.imprv_non_hstd_val as cur_imprv_non_hstd_val, 
	property_val.appraised_val as cur_appraised_val, 
	property_val.ag_use_val as cur_ag_use_val, 
	property_val.ag_market as cur_ag_mkt_val, 
	property_val.timber_market as cur_timb_mkt_val, 
	property_val.timber_use as cur_timb_use_val, 
	property_val1.land_hstd_val as prev_land_hstd_val, 
	property_val1.land_non_hstd_val as prev_land_non_hstd_val, 
	property_val1.imprv_hstd_val as prev_imprv_hstd_val, 
	property_val1.imprv_non_hstd_val as prev_imprv_non_hstd_val,
	property_val1.ag_use_val as prev_ag_use_val, 
	property_val1.ag_market as prev_ag_mkt_val, 
	property_val1.timber_market as prev_timb_mkt_val, 
	property_val1.timber_use as prev_timb_use_val, 
	property.geo_id, property_type.prop_type_desc, 
	property_freeze.freeze_yr,
	property_freeze.freeze_ceiling
from
	account
inner join
	property_val
inner join
	owner
on
	property_val.prop_id = owner.prop_id
and	property_val.prop_val_yr = owner.owner_tax_yr
and	property_val.sup_num = owner.sup_num
on
	account.acct_id = owner.owner_id
inner join
	sup_group
inner join
	supplement
on 
	sup_group.sup_group_id = supplement.sup_group_id
inner join
	supp_status
on 
	sup_group.status_cd = supp_status.status_cd
on 
	property_val.prop_val_yr = supplement.sup_tax_yr
and	property_val.sup_num = supplement.sup_num
inner join
	property
on 
	property_val.prop_id = property.prop_id
inner join
	property_type
on 
	property.prop_type_cd = property_type.prop_type_cd
left outer join
	property_freeze
on
	owner.prop_id = property_freeze.prop_id
and	owner.owner_id = property_freeze.owner_id
and	owner.owner_tax_yr = property_freeze.exmpt_tax_yr
and	owner.sup_num = property_freeze.sup_num
and	property_freeze.use_freeze = 'T'
left outer join
	property_val property_val1
on 
	property_val.prop_id = property_val1.prop_id
and	property_val.prop_val_yr = property_val1.prop_val_yr
and	property_val.prev_sup_num = property_val1.sup_num
left outer join
	pacs_user pacs_user1
on 
	sup_group.sup_bills_created_by_id = pacs_user1.pacs_user_id
left outer join
	pacs_user
on 
	sup_group.sup_accept_by_id = pacs_user1.pacs_user_id

GO


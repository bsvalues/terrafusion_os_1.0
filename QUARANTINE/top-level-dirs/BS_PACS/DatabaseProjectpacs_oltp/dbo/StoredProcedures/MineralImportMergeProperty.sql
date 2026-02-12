
create procedure MineralImportMergeProperty
	@pacs_user_id int,
	@run_id int
as

set nocount on


-- First Inactivate all Current Mineral and personal property from appraisal company*
update
	property_val
set
	prop_inactive_dt = getdate()
from
	property as p with (nolock)
where
	property_val.prop_id = p.prop_id
and	p.prop_type_cd in ('MN', 'P')
and	property_val.prop_val_yr in 
(
	select distinct
		mip.prop_val_yr
	from
		mineral_import_property as mip with (nolock)
	where
		mip.run_id = @run_id
)
and	property_val.appr_company_id in
(
	select
		ac.appr_company_id
	from
		appr_company as ac with (nolock)
	where
		isnull(ac.sys_flag, 'F') = 'T'
	and	isnull(ac.appr_company_id, 0) > 0
)


-- Now proceed with loading the newly converted property by mineral appraisal company
update
	property 
set
	geo_id = mip.geo_id,
	prop_type_cd = mip.prop_type_cd,
	state_cd = rtrim(mip.state_cd)
from
	mineral_import_property as mip with (nolock)
where
	property.prop_id = mip.prop_id
and	mip.run_id = @run_id


insert into property
(
	prop_id,
	geo_id,
	prop_create_dt,
	prop_type_cd,
	state_cd
)
select
	mip.prop_id,
	mip.geo_id,
	mip.prop_create_dt,
	mip.prop_type_cd,
	rtrim(mip.state_cd)
from
	mineral_import_property as mip with (nolock)
where
	mip.run_id = @run_id
and	not exists 
(
	select
		* 
	from
		property as p with (nolock) 
	where
		p.prop_id = mip.prop_id
)


-- mineral account
update
	mineral_acct
set
	field_cd = mip.field_cd,
	mineral_zone = mip.mineral_zone,
	rr_comm_num = mip.rr_comm_num,
	lease_id = mip.lease_id,
	lease_nm = mip.lease_nm,
	opr = mip.opr,
	type_of_int = mip.type_of_int,
	well_type = mip.well_type,
	geo_info = mip.geo_info,
	barrels_per_day = mip.barrels_per_day
from
	mineral_import_property as mip with (nolock)
where
	mineral_acct.prop_id = mip.prop_id
and	run_id = @run_id


insert into
	mineral_acct
(
	mineral_acct_id,
	prop_id,
	field_cd,
	mineral_zone,
	rr_comm_num,
	lease_id,
	lease_nm,
	opr,
	type_of_int,
	well_type,
	geo_info,
	barrels_per_day
)
select distinct
	mip.prop_id,
	mip.prop_id,
	mip.field_cd,
	mip.mineral_zone,
	mip.rr_comm_num,
	mip.lease_id,
	mip.lease_nm,
	mip.opr,
	mip.type_of_int,
	mip.well_type,
	mip.geo_info,
	mip.barrels_per_day
from
	mineral_import_property as mip with (nolock)
where
	mip.run_id = @run_id
and	not exists 
(
	select
		* 
	from
		mineral_acct as ma with (nolock)
	where
		ma.prop_id = mip.prop_id
	and	mip.run_id = @run_id
)


-- Populate Mineral Property
update
	property_val 
set
	legal_desc = mip.legal_desc,
	recalc_flag = 'C',
	assessed_val = mip.value,
	appraised_val = mip.value,
	market = mip.value,
	cost_value = mip.value,
	prop_inactive_dt = null,
	appr_company_id = mip.appr_company_id,
	mineral_int_pct = mip.mineral_int_pct,
	appr_method = 'C',
	rendered_val =
		case
			when mip.rendered_date is null then null
			else mip.value
		end,
	rendered_yr =
		case
			when mip.rendered_date is null then null
			else mip.prop_val_yr
		end
from
	mineral_import_property as mip with (nolock)
where
	property_val.prop_id = mip.prop_id
and	property_val.prop_val_yr = mip.prop_val_yr
and	mip.prop_type_cd = 'MN'
and	mip.run_id = @run_id


insert into
	property_val
(
	prop_id,
	sup_num,
	prop_val_yr,
	legal_desc,
	assessed_val,
	appraised_val,
	market,
	cost_value,
	appr_company_id,
	recalc_flag, 
	prev_sup_num,
	mineral_int_pct,
	appr_method,
	rendered_val,
	rendered_yr
)
select distinct
	mip.prop_id,
	0,
	mip.prop_val_yr,
	mip.legal_desc,
	mip.value,
	mip.value,
	mip.value,
	mip.value,
	mip.appr_company_id,
	'C',
	0,
	mip.mineral_int_pct,
	'C',
	case
		when mip.rendered_date is null then null
		else mip.value
	end,
	case
		when mip.rendered_date is null then null
		else mip.prop_val_yr
	end
from
	mineral_import_property as mip with (nolock)
where
	mip.prop_type_cd = 'MN' 
and	not exists
(
	select
		*
	from
		property_val as pv with (nolock)
	where
		pv.prop_id = mip.prop_id 
	and	pv.prop_val_yr = mip.prop_val_yr
)
and	mip.run_id = @run_id


-- populate personal property
insert into
	property_val
(
	prop_id,
	sup_num,
	prop_val_yr,
	appr_company_id,
	recalc_flag,
	prev_sup_num,
	appr_method
)
select distinct
	mip.prop_id,
	0,
	mip.prop_val_yr,
	mio.appr_company_id,
	'C',
	0,
	'C'
from
	mineral_import_property as mip with (nolock)
left outer join
	mineral_import_owner as mio with (nolock)
on
	mip.owner_id = mio.acct_id
and	mip.run_id = mio.run_id
where
	mip.prop_type_cd = 'P' 
and	not exists
(
	select
		*
	from
		property_val as pv with (nolock)
	where
		pv.prop_id = mip.prop_id 
	and	pv.prop_val_yr = mip.prop_val_yr
)
and	mip.run_id = @run_id


update
	property_val
set
	legal_desc = mip.legal_desc,
	prop_inactive_dt = null,
	appr_company_id = mio.appr_company_id,
	appr_method='C'
from
	mineral_import_property as mip with (nolock)
left outer join
	mineral_import_owner as mio with (nolock)
on
	mip.owner_id = mio.acct_id
and	mip.run_id = mio.run_id
where
	property_val.prop_id = mip.prop_id
and     property_val.prop_val_yr = mip.prop_val_yr
and     mip.prop_type_cd = 'P'
and	mip.run_id = @run_id


-- Set personal property value
update
	property_val
set
	assessed_val = mipi.value,
	appraised_val =  mipi.value,
	market = mipi.value
from
	mineral_import_property as mip with (nolock)
inner join
(
	select
		mip1.run_id,
		sum(mip1.value) as value,
		mip1.prop_id,
		mip1.prop_val_yr
	from
		mineral_import_property as mip1 with (nolock)
	where
		mip1.prop_type_cd = 'P'
	group by
		mip1.run_id,
		mip1.prop_id,
		mip1.prop_val_yr		
) as mipi
on
	mip.run_id = mipi.run_id
and	mip.prop_id = mipi.prop_id
and	mip.prop_val_yr = mipi.prop_val_yr
where
	property_val.prop_id = mipi.prop_id
and	property_val.prop_val_yr = mipi.prop_val_yr
and	mip.run_id = @run_id


insert into
	pp_rendition_tracking
(
	prop_id,
	prop_val_yr,
	extension1,
	extension2
)
select
	mip.prop_id,
	mip.prop_val_yr,
	mip.rendition_extension_1,
	mip.rendition_extension_2
from
	mineral_import_property as mip with (nolock)
where
	mip.run_id = @run_id
and	mip.prop_type_cd = 'P'
and	not exists
(
	select
		*
	from
		pp_rendition_tracking as prt with (nolock)
	where
		prt.prop_id = mip.prop_id
	and	prt.prop_val_yr = mip.prop_val_yr
)


update
	pers_prop_rendition
set
	rendition_date = mip.rendered_date,
	signed_by = '',
	notary_flag = 'F',
	notary = '',
	comment = 'System Generated from Mineral Import process',
	verified_flag = 'F',
	pacs_user_id = @pacs_user_id,
	value_flag = 'F',
	rendition_value = mip.value,
	active_flag = 'T'
from
	pers_prop_rendition as ppr with (nolock)
inner join
	mineral_import_property as mip with (nolock)
on
	mip.run_id = @run_id
and	mip.prop_id = ppr.prop_id
and	mip.prop_val_yr = ppr.rendition_year
and	mip.rendered_date is not null
and	mip.prop_type_cd = 'P'



insert into
	pers_prop_rendition
(
	prop_id,
	rendition_year,
	rendition_date,
	signed_by,
	notary_flag,
	notary,
	comment,
	verified_flag,
	pacs_user_id,
	value_flag,
	rendition_value,
	active_flag
)
select distinct
	mip.prop_id,
	mip.prop_val_yr,
	mip.rendered_date,
	'',
	'F',
	'',
	'System Generated from Mineral Import process',
	'F',
	@pacs_user_id,
	'F',
	mip.value,
	'T'
from
	mineral_import_property as mip with (nolock)
where
	mip.run_id = @run_id
and	mip.rendered_date is not null
and	mip.prop_type_cd = 'P'
and	not exists
(
	select
		*
	from
		pers_prop_rendition as ppr with (nolock)
	where
		ppr.prop_id = mip.prop_id
	and	ppr.rendition_year = mip.prop_val_yr
)


insert into
	prop_supp_assoc
(
	prop_id,
	owner_tax_yr,
	sup_num
)
select distinct
	mip.prop_id,
	mip.prop_val_yr,
	0
from
	mineral_import_property as mip with (nolock)
where
	not exists
(
	select
		*
	from
		prop_supp_assoc as psa with (nolock)
	where
		psa.prop_id = mip.prop_id
	and	psa.owner_tax_yr = mip.prop_val_yr
)
and	mip.run_id = @run_id


--	agent_assoc records should be removed for all properties that are fixin to be copied
delete
	agent_assoc
from
	mineral_import_property as mip with (nolock)
where
	agent_assoc.prop_id = mip.prop_id
and	agent_assoc.owner_tax_yr = mip.prop_val_yr
and	mip.run_id = @run_id


insert into
	agent_assoc
(
	agent_id,
	prop_id,
	owner_id,
	owner_tax_yr,
	arb_mailings,
	ca_mailings,
	ent_mailings,
	auth_to_protest,
	auth_to_resolve,
	auth_confidential,
	auth_other
)
select distinct
	mip.agent_id,
	mip.prop_id,
	mip.owner_id,
	mip.prop_val_yr,
	mip.agent_arb_mailings,
	mip.agent_ca_mailings,
	mip.agent_ent_mailings,
	mip.agent_auth_to_protest,
	mip.agent_auth_to_resolve,
	mip.agent_auth_confidential,
	mip.agent_auth_other
from
	mineral_import_property as mip with (nolock)
where
	mip.run_id = @run_id
and	mip.agent_id > 0
and	not exists
(
	select
		*
	from
		agent_assoc as aa with (nolock)
	where
		aa.agent_id = mip.agent_id
	and	aa.prop_id = mip.prop_id
	and	aa.owner_id = mip.owner_id
	and	aa.owner_tax_yr = mip.prop_val_yr
)

--	Ownership records should be removed for all properties that are fixin to be copied.	
delete
	owner
from
	mineral_import_property as mip with (nolock)
where
	owner.prop_id = mip.prop_id
and	owner.owner_tax_yr = mip.prop_val_yr
and	mip.run_id = @run_id


insert into
	owner
(
	prop_id,
	owner_id,
	sup_num,
	owner_tax_yr,
	type_of_int,
	pct_ownership,
	updt_dt
)
select distinct
	mip.prop_id,
	mip.owner_id,
	0,
	mip.prop_val_yr,
	mip.type_of_int,
	100,
	getdate()
from
	mineral_import_property as mip with (nolock)
where
	not exists
(
	select
		*
	from
		owner as o with (nolock)
	where
		o.prop_id = mip.prop_id 
	and	o.owner_tax_yr = mip.prop_val_yr
	and	o.owner_id = mip.owner_id
)
and	mip.run_id = @run_id


delete
	entity_prop_assoc 
from
	mineral_import_property as mip with (nolock)
where
	entity_prop_assoc.prop_id = mip.prop_id 
and	entity_prop_assoc.tax_yr = mip.prop_val_yr
and	mip.run_id = @run_id


delete
	property_entity_exemption 
from
	mineral_import_property as mip with (nolock)
where
	property_entity_exemption.prop_id = mip.prop_id 
and	property_entity_exemption.owner_tax_yr = mip.prop_val_yr
and	mip.run_id = @run_id


insert into
	entity_prop_assoc
(
	entity_id,
	prop_id,
	sup_num,
	tax_yr,
	entity_prop_pct
)
select distinct  
	mie.entity_id,
	mie.prop_id,
	0,
	mie.tax_yr,
	mie.entity_prop_pct
from
	mineral_import_entity as mie with (nolock)
where
	not exists
(
	select
		*
	from
		entity_prop_assoc as epa with (nolock)
	where
		epa.prop_id = mie.prop_id
	and	epa.tax_yr = mie.tax_yr
	and	epa.entity_id = mie.entity_id
)
and	mie.entity_id <> 0
and	mie.run_id = @run_id
and	mie.entity_def = 0


delete
	pers_prop_entity_assoc
from
	mineral_import_property as mip with (nolock)
where
	pers_prop_entity_assoc.prop_id = mip.prop_id 
and	pers_prop_entity_assoc.prop_val_yr = mip.prop_val_yr
and	mip.run_id = @run_id


delete
	pers_prop_exemption_assoc
from
	mineral_import_property as mip with (nolock)
where
	pers_prop_exemption_assoc.prop_id = mip.prop_id 
and	pers_prop_exemption_assoc.prop_val_yr = mip.prop_val_yr
and	mip.run_id = @run_id


delete
	pers_prop_owner_assoc
from
	mineral_import_property as mip with (nolock)
where
	pers_prop_owner_assoc.prop_id = mip.prop_id 
and	pers_prop_owner_assoc.prop_val_yr = mip.prop_val_yr
and	mip.run_id = @run_id


delete
	pers_prop_sub_seg 
from
	mineral_import_property as mip with (nolock)
where
	pers_prop_sub_seg.prop_id = mip.prop_id 
and	pers_prop_sub_seg.prop_val_yr = mip.prop_val_yr
and	mip.run_id = @run_id


delete
	pers_prop_seg 
from
	mineral_import_property as mip with (nolock)
where
	pers_prop_seg.prop_id = mip.prop_id 
and	pers_prop_seg.prop_val_yr = mip.prop_val_yr
and	mip.run_id = @run_id


insert into
	pers_prop_seg
(
	prop_id,
	prop_val_yr,
	sup_num,
	pp_seg_id,
	sale_id,
	pp_area,
	pp_unit_count,
	pp_pct_good,
	pp_orig_cost,
	pp_economic_pct,
	pp_physical_pct,
	pp_flat_val,
	pp_prior_yr_val,
	pp_last_notice_val,
	pp_appraised_val,
	pp_appraise_meth,
	pp_new_val,
	pp_mkt_val,
	pp_unit_price,
	pp_description,
	pp_state_cd,
	pp_deprec_override,
	pp_active_flag
)
select distinct
	prop_id,
	prop_val_yr,
	0,
	pp_seg_id,
	0,
	0,
	1,
	100,
	0,
	100,
	100,
	value,
	0,
	0,
	0,
	'F',
	0,
	value,
	0.00,
	legal_desc,
	rtrim(state_cd),
	'F',
	'T'
from
	mineral_import_property as mip with (nolock)
where
	mip.prop_type_cd = 'P'
and	not exists
(
	select
		*
	from
		pers_prop_seg as pps with (nolock)
	where
		pps.prop_id = mip.prop_id 
	and	pps.prop_val_yr = mip.prop_val_yr
)
and	mip.run_id = @run_id

GO


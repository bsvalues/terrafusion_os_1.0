

create view lease_mineral_do_vw

as

select
	lhv.lease_id,
	lhv.entities,
	lhv.lease_yr,
	lhv.rev_num,
	lhv.lease_name,
	lhv.operator,
	lhv.geo_info,
	lhv.rrc_number,
	isnull(lhv.total_wi_assessed, 0) as total_wi_assessed,
	isnull(lhv.total_ri_assessed, 0) as total_ri_assessed,
	isnull(lhv.total_or_assessed, 0) as total_or_assessed,
	isnull(lhv.curr_yr_7_8, 0) as curr_yr_7_8,
	isnull(lhv.curr_yr_1_8, 0) as curr_yr_1_8,
	(isnull(lhv.curr_yr_7_8, 0) + isnull(lhv.curr_yr_1_8, 0)) as total_value,
	isnull(lhv.total_assessed, 0) as total_assessed,
	lhv.field_id,
	lhv.lease_dt,
	lhv.participation_pct,
	lhv.gatherer_cd,
	p.prop_id,
	p.geo_id,
	o.owner_id,
	a.file_as_name,
	addr.addr_line1,
	addr.addr_line2,
	addr.addr_line3,
	addr.addr_city,
	addr.addr_state,
	addr.addr_zip,
	lpa.interest_type_cd,
	lpa.interest_pct,
	pv.assessed_val
from
	lease_header_vw as lhv with (nolock)
inner join
	lease_prop_assoc as lpa with (nolock)
on
	lpa.lease_id = lhv.lease_id
and	lpa.lease_yr = lhv.lease_yr
and	lpa.rev_num = lhv.rev_num
inner join
	property as p with (nolock)
on
	p.prop_id = lpa.prop_id
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = lpa.prop_id
and	pv.prop_val_yr = lpa.lease_yr
and	pv.sup_num = 0
and	pv.prop_inactive_dt is null
inner join
	owner as o with (nolock)
on
	o.prop_id = pv.prop_id
and	o.owner_tax_yr = pv.prop_val_yr
and	o.sup_num = pv.sup_num
inner join
	account as a with (nolock)
on
	a.acct_id = o.owner_id
inner join
	address as addr with (nolock)
on	addr.acct_id = o.owner_id
and	addr.primary_addr = 'Y'

GO


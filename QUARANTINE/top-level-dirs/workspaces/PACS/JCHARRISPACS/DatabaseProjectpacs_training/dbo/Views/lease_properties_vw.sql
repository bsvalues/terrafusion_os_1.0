

create view dbo.lease_properties_vw
as
select
	lpa.lease_id,
	lpa.lease_yr,
	lpa.rev_num,
	lpa.prop_id,
	lpa.sup_num,
	lpa.interest_type_cd,
	lpa.interest_pct,
	a.file_as_name as owner_name,
	isnull(pv.assessed_val, 0) as value
from
	lease_prop_assoc as lpa with (nolock)
inner join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = lpa.prop_id
and	psa.owner_tax_yr = lpa.lease_yr
and	psa.sup_num = lpa.sup_num
inner join
	property_val as pv with (nolock)
on	pv.prop_id = lpa.prop_id
and	pv.prop_val_yr = lpa.lease_yr
and	pv.sup_num = lpa.sup_num
and	pv.prop_inactive_dt is null
inner join
	owner as o with (nolock)
on
	o.prop_id = lpa.prop_id
and	o.owner_tax_yr = lpa.lease_yr
and	o.sup_num = lpa.sup_num
inner join
	account as a with (nolock)
on
	a.acct_id = o.owner_id

GO


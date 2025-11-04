
create view dbo.pending_supplement_vw
as
select
	psa.prop_id,
	psa.owner_tax_yr,
	psa.sup_num,
	pv.sup_dt,
	p.geo_id,
	a.file_as_name as owner_name,
	pv.sup_cd,
	pv.sup_desc,
	pv.legal_desc,
	pv.market,
	isnull(pv.udi_parent,'') as udi_parent,
	isnull(pv.udi_status, '') as udi_status,
	isnull(pv.udi_parent_prop_id, -1) as udi_parent_prop_id,
	dbo.fn_GetPropGroupCodes(psa.prop_id) as prop_group_cd
from
	prop_supp_assoc as psa with (nolock)
inner join
	property as p with (nolock)
on
	p.prop_id = psa.prop_id
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	isnull(pv.udi_parent, '') not in ('D', 'T')
and	isnull(pv.udi_parent_prop_id, -1) <= 0
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
	supplement as s with (nolock)
on
	s.sup_tax_yr = psa.owner_tax_yr
and	s.sup_num = psa.sup_num
inner join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = s.sup_group_id
--	Hard-coded values for sup_group_id and sup_num are used for performance reasons.
--	The more flexible approach would be to eliminate the 'where' clause and add
--	the following condition to the inner join on sup_group: 'and sg.status_cd = 'P'
where
	s.sup_group_id = 32767
and	s.sup_num = 32767
and not exists (
	select * 
	from dbo.split_merge as sm with(nolock)
	inner join dbo.split_merge_prop_assoc as smpa with(nolock)
	on sm.split_merge_id = smpa.split_merge_id
	inner join dbo.split_merge_year_assoc as smya with(nolock)
	on sm.split_merge_id = smya.split_merge_id
	where pv.prop_id = smpa.prop_id and pv.prop_val_yr = smya.year
	and (sm.status not in ('COMPLETE','CANCELED') or sm.sup_group is null)
)

union


select
	psa.prop_id,
	psa.owner_tax_yr,
	psa.sup_num,
	pv.sup_dt,
	p.geo_id,
	'UDI Parent' as owner_name,
	pv.sup_cd,
	pv.sup_desc,
	pv.legal_desc,
	pv.market,
	isnull(pv.udi_parent,'') as udi_parent,
	isnull(pv.udi_status, '') as udi_status,
	isnull(pv.udi_parent_prop_id, -1) as udi_parent_prop_id,
	dbo.fn_GetPropGroupCodes(psa.prop_id) as prop_group_cd
from
	prop_supp_assoc as psa with (nolock)
inner join
	property as p with (nolock)
on
	p.prop_id = psa.prop_id
inner join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
and	isnull(pv.udi_parent, '') in ('D', 'T')
inner join
	supplement as s with (nolock)
on
	s.sup_tax_yr = psa.owner_tax_yr
and	s.sup_num = psa.sup_num
inner join
	sup_group as sg with (nolock)
on
	sg.sup_group_id = s.sup_group_id
--	Hard-coded values for sup_group_id and sup_num are used for performance reasons.
--	The more flexible approach would be to eliminate the 'where' clause and add
--	the following condition to the inner join on sup_group: 'and sg.status_cd = 'P'
where
	s.sup_group_id = 32767
and	s.sup_num = 32767
group by
	psa.prop_id,
	psa.owner_tax_yr,
	psa.sup_num,
	pv.sup_dt,
	p.geo_id,
	pv.sup_cd,
	pv.sup_desc,
	pv.legal_desc,
	pv.market,
	isnull(pv.udi_parent,''),
	isnull(pv.udi_status, ''),
	isnull(pv.udi_parent_prop_id, -1)

GO


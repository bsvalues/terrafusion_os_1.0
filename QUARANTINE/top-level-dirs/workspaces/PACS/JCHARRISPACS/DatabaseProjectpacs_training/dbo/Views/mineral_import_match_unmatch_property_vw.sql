

create view mineral_import_match_unmatch_property_vw
as
select distinct
	mip.run_id as run_id,
	mip.prop_type_cd as prop_type_cd,
	mip.xref as imported_property_id,
	mio.owner_no as imported_owner_id,
	mio.file_as_name as imported_owner_name,
	mip.legal_desc as imported_legal_description,
	p.prop_id as pacs_property_id,
	o.owner_id as pacs_owner_id,
	a.file_as_name as pacs_owner_name,
	pv.legal_desc as pacs_legal_description
from
	mineral_import_property as mip with (nolock)
inner join
	mineral_import as mi with (nolock)
on
	mi.run_id = mip.run_id
inner join
	mineral_import_owner as mio with (nolock)
on
	mio.acct_id = mip.owner_id
left outer join
	property as p with (nolock)
on
	p.prop_id = mip.prop_id
left outer join
	prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = p.prop_id
and	psa.owner_tax_yr = mi.year
left outer join
	owner as o with (nolock)
on
	o.prop_id = psa.prop_id
and	o.owner_tax_yr = psa.owner_tax_yr
left outer join
	account as a with (nolock)
on
	a.acct_id = o.owner_id
left outer join
	property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num
where
	mip.new_prop_id > 0

GO


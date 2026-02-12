

create view mineral_import_matched_property_vw
as
select distinct
	mip.run_id as run_id,
	mip.xref as imported_property_id,
	mip.legal_desc as imported_legal_description,
	p.prop_id as pacs_property_id,
	pv.legal_desc as pacs_legal_description
from
	mineral_import as mi with (nolock)
inner join
	mineral_import_property as mip with (nolock)
on
	mip.run_id = mi.run_id
and	isnull(mip.new, 'F') <> 'T'
inner join
	dbo.property as p with (nolock)
on
	p.prop_id = mip.prop_id
left outer join
	dbo.prop_supp_assoc as psa with (nolock)
on
	psa.prop_id = p.prop_id
and	psa.owner_tax_yr = mi.year
left outer join
	dbo.property_val as pv with (nolock)
on
	pv.prop_id = psa.prop_id
and	pv.prop_val_yr = psa.owner_tax_yr
and	pv.sup_num = psa.sup_num

GO


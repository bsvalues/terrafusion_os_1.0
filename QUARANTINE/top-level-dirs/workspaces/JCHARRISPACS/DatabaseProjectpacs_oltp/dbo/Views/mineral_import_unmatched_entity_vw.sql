

create view mineral_import_unmatched_entity_vw
as
select
	mie.run_id,
	mie.entity_code,
	mip.xref as imported_property_id,
	mip.legal_desc as imported_legal_description
from
	mineral_import as mi with (nolock)
inner join
	mineral_import_entity as mie with (nolock)
on
	mie.run_id = mi.run_id
and	mie.entity_def = 1
inner join
	mineral_import_property as mip with (nolock)
on
	mip.run_id = mi.run_id
and	mip.xref = mie.xref
left outer join
	mineral_import_entity_map as miem with (nolock)
on
	miem.year = mi.year
and	miem.appr_company_id = mi.appr_company_id
and	miem.appr_company_entity_cd = mie.entity_code
where
	miem.year is null

GO


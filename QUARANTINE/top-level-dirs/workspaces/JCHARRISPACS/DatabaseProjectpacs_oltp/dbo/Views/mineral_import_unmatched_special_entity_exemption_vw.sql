
create view mineral_import_unmatched_special_entity_exemption_vw
as
select
	misee.run_id,
	misee.entity_code,
	misee.exmpt_type_cd,
	mip.xref as imported_property_id,
	mip.legal_desc as imported_legal_description
from
	mineral_import as mi with (nolock)
inner join
	mineral_import_special_entity_exemption as misee with (nolock)
on
	misee.run_id = mi.run_id
and	misee.entity_def = 1
inner join
	mineral_import_property as mip with (nolock)
on
	mip.run_id = mi.run_id
and	mip.xref = misee.xref
left outer join
	mineral_import_entity_map as miem with (nolock)
on
	miem.year = mi.year
and	miem.appr_company_id = mi.appr_company_id
and	miem.appr_company_entity_cd = misee.entity_code
where
	miem.year is null

GO


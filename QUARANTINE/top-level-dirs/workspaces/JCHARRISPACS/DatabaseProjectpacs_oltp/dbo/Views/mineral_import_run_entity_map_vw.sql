

create view mineral_import_run_entity_map_vw
as
select distinct
	mie.run_id,
	mi.year,
	mi.appr_company_id,
	ac.appr_company_nm,
	mie.entity_code,
	miem.entity_id,
	e.entity_cd,
	a.file_as_name as entity_name,
	miem.entity_in_cad
from
	dbo.mineral_import_entity as mie with (nolock)
join
	dbo.mineral_import as mi with (nolock)
on
	mi.run_id = mie.run_id
join
	dbo.appr_company as ac with (nolock)
on
	ac.appr_company_id = mi.appr_company_id
left outer join
	dbo.mineral_import_entity_map as miem with (nolock)
on
	miem.year = mi.year
and	miem.appr_company_id = mi.appr_company_id
and	miem.appr_company_entity_cd = mie.entity_code
left outer join
	dbo.entity as e with (nolock)
on
	e.entity_id = miem.entity_id
left outer join
	dbo.account as a with (nolock)
on
	a.acct_id = e.entity_id

GO


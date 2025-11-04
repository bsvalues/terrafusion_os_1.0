

create view mineral_import_entity_map_vw
as
select
	miem.year,
	miem.appr_company_id,
	ac.appr_company_nm,
	miem.appr_company_entity_cd,
	miem.entity_id,
	e.entity_cd,
	a.file_as_name as entity_name,
	miem.entity_in_cad
from
	mineral_import_entity_map as miem with (nolock)
join
	appr_company as ac with (nolock)
on
	ac.appr_company_id = miem.appr_company_id
left outer join
	entity as e with (nolock)
on
	e.entity_id = miem.entity_id
left outer join
	account as a with (nolock)
on
	a.acct_id = e.entity_id

GO


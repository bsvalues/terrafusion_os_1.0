

create view mineral_import_vw
as
select
	mi.run_id,
	mi.year,
	mi.appr_company_id,
	ac.appr_company_nm
from
	dbo.mineral_import as mi with (nolock)
join
	dbo.appr_company as ac with (nolock)
on
	ac.appr_company_id = mi.appr_company_id

GO


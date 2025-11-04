

create view mineral_import_matched_owner_vw
as
select distinct
	mio.run_id as run_id,
	mio.owner_no as imported_owner_number,
	mio.file_as_name as imported_owner_name,
	o.owner_id as pacs_owner_id,
	a.file_as_name as pacs_owner_name
from
	mineral_import as mi with (nolock)
inner join
	mineral_import_owner as mio with (nolock)
on
	mio.run_id = mi.run_id
and	isnull(mio.new, 'F') <> 'T'
inner join
	account as a with (nolock)
on
	a.acct_id = mio.acct_id
inner join
	owner as o with (nolock)
on
	o.owner_id = a.acct_id
and	o.owner_tax_yr = mi.year

GO


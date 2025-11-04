

create view mineral_import_unmatched_owner_vw
as
select
	mio.run_id as run_id,
	mio.owner_no as imported_owner_number,
	mio.file_as_name as imported_owner_name
from
	mineral_import as mi with (nolock)
inner join
	mineral_import_owner as mio with (nolock)
on
	mio.run_id = mi.run_id
and	isnull(mio.new, 'F') = 'T'

GO




create view mineral_import_unmatched_property_vw
as
select distinct
	mip.run_id as run_id,
	mip.xref as imported_property_id,
	mip.legal_desc as imported_legal_description,
	mio.file_as_name as imported_owner_name
from
	mineral_import as mi with (nolock)
inner join
	mineral_import_property as mip with (nolock)
on
	mip.run_id = mi.run_id
and	isnull(mip.new, 'F') = 'T'
inner join
	mineral_import_owner as mio with (nolock)
on
	mio.run_id = mi.run_id
and	mio.owner_no = mip.owner_no

GO




create view mineral_import_totals_entity_vw
as
select distinct
	mi.run_id,
	mie.entity_code,
	mip.xref,
	mip.legal_desc,
	mip.state_cd,
	mip.owner_no,
	mio.file_as_name,
	(isnull(mip.value, 0) * (mie.entity_prop_pct / 100.0)) as value
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
	mip.run_id = mie.run_id
and	mip.xref = mie.xref
inner join
	mineral_import_owner as mio with (nolock)
on
	mio.run_id = mie.run_id
and	mio.owner_no = mip.owner_no

GO


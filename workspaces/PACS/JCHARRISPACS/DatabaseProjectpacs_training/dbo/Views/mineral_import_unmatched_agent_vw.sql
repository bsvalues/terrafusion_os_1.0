

create view mineral_import_unmatched_agent_vw
as
select
	mia.run_id as run_id,
	mia.agent_code as imported_agent_code,
	mia.file_as_name as imported_agent_name
from
	mineral_import as mi with (nolock)
inner join
	mineral_import_agent as mia with (nolock)
on
	mia.run_id = mi.run_id
and	isnull(mia.new, 'F') = 'T'

GO


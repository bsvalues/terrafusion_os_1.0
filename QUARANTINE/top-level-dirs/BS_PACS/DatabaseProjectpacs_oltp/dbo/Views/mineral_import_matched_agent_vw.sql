

create view mineral_import_matched_agent_vw
as
select distinct
	mia.run_id as run_id,
	mia.agent_code as imported_agent_code,
	mia.file_as_name as imported_agent_name,
	a.agent_id as pacs_agent_id,
	acct.file_as_name as pacs_agent_name
from
	mineral_import as mi with (nolock)
inner join
	mineral_import_agent as mia with (nolock)
on
	mia.run_id = mi.run_id
and	isnull(mia.new, 'F') <> 'T'
inner join
	account as acct with (nolock)
on
	acct.acct_id = mia.acct_id
inner join
	agent as a with (nolock)
on
	a.agent_id = acct.acct_id

GO


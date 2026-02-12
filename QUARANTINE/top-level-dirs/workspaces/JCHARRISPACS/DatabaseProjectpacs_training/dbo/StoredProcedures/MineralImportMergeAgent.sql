

create procedure MineralImportMergeAgent
	@pacs_user_id int,
	@run_id int
as

set nocount on


update
	account 
set
	file_as_name = mia.file_as_name,
	ref_id1 = mia.agent_code,
	source = mia.source,
	acct_create_dt = mia.acct_create_dt,
	appr_company_id = mia.appr_company_id
from
	mineral_import_agent as mia with (nolock)
where
	mia.run_id = @run_id
and	mia.acct_id > 0
and	mia.acct_id = account.acct_id


insert into
	account
(
	acct_id,
	file_as_name,
	ref_id1,
	source,
	acct_create_dt,
	appr_company_id
)
select distinct
	mia.acct_id,
	mia.file_as_name,
	mia.agent_code,
	mia.source,
	mia.acct_create_dt,
	mia.appr_company_id
from
	mineral_import_agent as mia with (nolock)
where 
	mia.run_id = @run_id
and	mia.acct_id > 0
and	not exists 
(
	select
		*
	from
		account as a with (nolock)
	where
		a.acct_id = mia.acct_id
)


--	There's no need to update agent table if agent already exists since we're only setting agent_id.
--	So, we'll proceed directly to inserting new agents in the agent table
insert into
	agent
(
	agent_id
)
select
	mia.acct_id
from
	mineral_import_agent as mia with (nolock)
inner join
	account as a with (nolock)
on
	a.acct_id = mia.acct_id
where
	mia.run_id = @run_id
and	mia.acct_id > 0
and	not exists
(
	select
		*
	from
		agent with (nolock)
	where
		agent.agent_id = mia.acct_id
)



update
	address
set
	addr_line1 = mia.addr_line1,
	addr_line2 = mia.addr_line2,
	addr_line3 = mia.addr_line3,
	addr_city  = mia.addr_city,
	addr_state = mia.addr_st,
	zip = case when len(replace(ltrim(rtrim(mia.addr_zip)), '-', '')) >= 5 then left(replace(ltrim(rtrim(mia.addr_zip)), '-', ''), 5) else '' end,
	cass = case when len(replace(ltrim(rtrim(mia.addr_zip)), '-', '')) = 9 then substring(replace(ltrim(rtrim(mia.addr_zip)), '-', ''), 6, 4) else null end
from
	mineral_import_agent as mia with (nolock)
where
	mia.run_id = @run_id
and	mia.acct_id > 0
and	address.acct_id = mia.acct_id
and	address.primary_addr = 'Y'


insert into
	address
(
	acct_id,
	addr_type_cd,
	primary_addr,
	addr_line1, 
	addr_line2, 
	addr_line3, 
	addr_city, 
	addr_state,
	zip,
	cass
)
select  distinct
	acct_id,
	'M',
	'Y',
	addr_line1,
	addr_line2,
	addr_line3,
	addr_city,
	addr_st,
	case when len(replace(ltrim(rtrim(addr_zip)), '-', '')) >= 5 then left(replace(ltrim(rtrim(addr_zip)), '-', ''), 5) else '' end,
	case when len(replace(ltrim(rtrim(addr_zip)), '-', '')) = 9 then substring(replace(ltrim(rtrim(addr_zip)), '-', ''), 6, 4) else null end
from
	mineral_import_agent as mia with (nolock)
where
	mia.run_id = @run_id
and	mia.acct_id > 0
and	not exists
(
	select
		*
	from
		address
	where
		address.acct_id = mia.acct_id
)

GO


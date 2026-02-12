

create procedure MineralImportMergeOwner
	@pacs_user_id int,
	@run_id int
as

set nocount on


update
	account 
set
	file_as_name = mio.file_as_name,
	ref_id1 = mio.owner_no,
	source = mio.source,
	acct_create_dt = mio.acct_create_dt,
	appr_company_id = mio.appr_company_id
from
	mineral_import_owner as mio with (nolock)
where
	account.acct_id = mio.acct_id
and	mio.run_id = @run_id


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
	mio.acct_id,
	mio.file_as_name,
	mio.owner_no,
	mio.source,
	mio.acct_create_dt,
	mio.appr_company_id
from
	mineral_import_owner as mio with (nolock)
where 
	mio.run_id = @run_id
and	not exists 
(
	select
		*
	from
		account as a with (nolock)
	where
		a.acct_id = mio.acct_id
)


update
	address
set
	addr_line1 = mio.addr_line1,
	addr_line2 = mio.addr_line2,
	addr_line3 = mio.addr_line3,
	addr_city  = mio.addr_city,
	addr_state = mio.addr_st,
	zip = case when len(replace(ltrim(rtrim(mio.addr_zip)), '-', '')) >= 5 then left(replace(ltrim(rtrim(mio.addr_zip)), '-', ''), 5) else '' end,
	cass = case when len(replace(ltrim(rtrim(mio.addr_zip)), '-', '')) = 9 then substring(replace(ltrim(rtrim(mio.addr_zip)), '-', ''), 6, 4) else null end
from
	mineral_import_owner as mio with (nolock)
where
	address.acct_id = mio.acct_id
and	address.primary_addr = 'Y'
and	mio.run_id = @run_id


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
	mineral_import_owner as mio with (nolock)
where
	mio.run_id = @run_id
and	not exists
(
	select
		*
	from
		address
	where
		address.acct_id = mio.acct_id
)

GO




create procedure PenpadGetSpecialCaseKeyValue_owner
	@szKeys varchar(512) output
as

set nocount on

	select
		@szKeys = a.file_as_name
	from #trigger_table as o
	join account as a on
		o.owner_id = a.acct_id

set nocount off

GO


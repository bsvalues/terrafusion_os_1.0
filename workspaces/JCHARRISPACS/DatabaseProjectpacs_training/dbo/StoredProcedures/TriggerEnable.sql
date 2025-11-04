
create procedure TriggerEnable
	@szTableName sysname,
	@bEnable bit = 1
as
/*
	Take note that the triggers on table in question
	must support usage of TriggerGetEnabled.
	This is a workaround to [alter table tablename disable trigger all]
	being disabled b/c of replication.
*/

set nocount on

	begin transaction

	update pacs_trigger_enable with(rowlock, holdlock)
	set bEnabled = @bEnable
	where szTableName = @szTableName

	if ( @@rowcount = 0 )
	begin
		insert pacs_trigger_enable with(rowlock, holdlock) (
			szTableName, bEnabled
		) values (
			@szTableName, @bEnable
		)
	end

	commit transaction

GO


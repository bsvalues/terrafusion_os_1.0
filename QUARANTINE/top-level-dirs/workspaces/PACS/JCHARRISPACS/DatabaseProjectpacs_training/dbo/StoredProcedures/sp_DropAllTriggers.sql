
create procedure sp_DropAllTriggers

as

set nocount on

	declare
		@szTriggerName sysname,
		@szSQL varchar(2048)

	declare curTriggers insensitive cursor
	for
		select t_triggers.name
		from sysobjects as t_triggers
		join sysobjects as t_tables on
			t_triggers.parent_obj = t_tables.id
		where
			t_triggers.xtype = 'TR' and
			t_tables.xtype = 'U'
	for read only

	open curTriggers
	fetch next from curTriggers into @szTriggerName

	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'drop trigger ' + @szTriggerName
		exec(@szSQL)

		fetch next from curTriggers into @szTriggerName
	end

	close curTriggers
	deallocate curTriggers

set nocount off

GO


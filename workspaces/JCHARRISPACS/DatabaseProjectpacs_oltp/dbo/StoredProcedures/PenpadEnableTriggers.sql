

create procedure PenpadEnableTriggers
	@bEnable bit
as

set nocount on

	if ( db_name() <> 'penpad' )
	begin
		/* To execute this on a pacsserver would be a capital offense */
		return(-1)
	end

	declare @szTableName sysname
	declare @szSQL varchar(512)

	/* All tables that have triggers */
	declare curTables cursor
	for
		select distinct t_tables.name
		from sysobjects as t_triggers
		join sysobjects as t_tables on
			t_triggers.parent_obj = t_tables.id
		where
			t_triggers.xtype = 'TR'
	for read only

	open curTables
	fetch next from curTables into @szTableName

	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'alter table ' + @szTableName

		if ( @bEnable = 1 )
		begin
			set @szSQL = @szSQL + ' enable'
		end
		else
		begin
			set @szSQL = @szSQL + ' disable'
		end

		set @szSQL = @szSQL + ' trigger all'

		exec(@szSQL)

		fetch next from curTables into @szTableName
	end

	close curTables
	deallocate curTables

set nocount off

GO


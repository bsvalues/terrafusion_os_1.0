
create procedure PenpadEnableForeignKeys
	@bEnable bit
as

set nocount on

	if ( db_name() <> 'penpad' )
	begin
		/* To execute this on a pacsserver would be a capital offense */
		return(-1)
	end

	declare @szTableName sysname
	declare @szFKName sysname
	declare @szSQL varchar(512)

	/* All foreign keys */
	declare curForeignKeys cursor
	for
		select distinct t_tables.name, t_foreignkeys.name
		from sysobjects as t_foreignkeys
		join sysobjects as t_tables on
			t_foreignkeys.parent_obj = t_tables.id and
			objectproperty(t_tables.id, 'IsMSShipped') = 0
		where
			t_foreignkeys.xtype = 'F'
	for read only

	open curForeignKeys
	fetch next from curForeignKeys into @szTableName, @szFKName

	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'alter table ' + @szTableName

		if ( @bEnable = 1 )
		begin
			set @szSQL = @szSQL + ' check'
		end
		else
		begin
			set @szSQL = @szSQL + ' nocheck'
		end

		set @szSQL = @szSQL + ' constraint ' + @szFKName

		exec(@szSQL)

		fetch next from curForeignKeys into @szTableName, @szFKName
	end

	close curForeignKeys
	deallocate curForeignKeys

GO


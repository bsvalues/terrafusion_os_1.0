

create procedure PenpadDropTables

as

set nocount on

	if ( db_name() <> 'penpad' )
	begin
		/* To execute this on a pacsserver would be a capital offense */
		return(-1)
	end

	declare @szTableName sysname
	declare @szSQL varchar(512)

	declare curTables cursor
	for
		select name
		from sysobjects
		where
			xtype = 'U'
	for read only

	open curTables
	fetch next from curTables into @szTableName

	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'drop table ' + @szTableName
		
		exec(@szSQL)

		fetch next from curTables into @szTableName
	end

	close curTables
	deallocate curTables

set nocount off

GO


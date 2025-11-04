

create procedure PenpadDropProcedures

as

set nocount on

	if ( db_name() <> 'penpad' )
	begin
		/* To execute this on a pacsserver would be a capital offense */
		return(-1)
	end

	declare @szProcName sysname
	declare @szSQL varchar(512)

	declare curProcs cursor
	for
		select name
		from sysobjects
		where
			xtype = 'P'
	for read only

	open curProcs
	fetch next from curProcs into @szProcName

	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'drop procedure ' + @szProcName
		
		exec(@szSQL)

		fetch next from curProcs into @szProcName
	end

	close curProcs
	deallocate curProcs

set nocount off

GO


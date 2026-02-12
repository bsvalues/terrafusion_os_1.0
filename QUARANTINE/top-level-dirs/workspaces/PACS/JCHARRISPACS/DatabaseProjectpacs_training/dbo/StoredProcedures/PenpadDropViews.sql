

create procedure PenpadDropViews

as

set nocount on

	if ( db_name() <> 'penpad' )
	begin
		/* To execute this on a pacsserver would be a capital offense */
		return(-1)
	end

	declare @szViewName sysname
	declare @szSQL varchar(512)

	declare curViews cursor
	for
		select name
		from sysobjects
		where
			xtype = 'V'
	for read only

	open curViews
	fetch next from curViews into @szViewName

	while ( @@fetch_status = 0 )
	begin
		set @szSQL = 'drop view ' + @szViewName
		
		exec(@szSQL)

		fetch next from curViews into @szViewName
	end

	close curViews
	deallocate curViews

set nocount off

GO


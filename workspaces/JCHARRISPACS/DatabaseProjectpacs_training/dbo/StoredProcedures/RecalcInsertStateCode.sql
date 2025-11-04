
create procedure RecalcInsertStateCode
	@szBCPFile varchar(255),
	@szTable sysname,
	@bTableLock bit
as

set nocount on

	declare @szSQL varchar(512)

	if ( @bTableLock = 1 )
	begin
		set @szSQL = 'bulk insert ' + @szTable + ' from ''' + @szBCPFile + ''' with (maxerrors = 0, tablock)'
	end
	else
	begin
		set @szSQL = 'bulk insert ' + @szTable + ' from ''' + @szBCPFile + ''' with (maxerrors = 0)'
	end

	exec(@szSQL)

GO


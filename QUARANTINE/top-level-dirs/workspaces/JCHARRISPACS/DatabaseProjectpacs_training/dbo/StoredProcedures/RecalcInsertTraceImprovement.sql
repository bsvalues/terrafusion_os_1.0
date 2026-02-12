
create procedure RecalcInsertTraceImprovement
	@szBCPFile varchar(512),
	@bTableLock bit
as

set nocount on

	declare @szSQL varchar(512)

	if ( @bTableLock = 1 )
	begin
		set @szSQL = '
			bulk insert recalc_trace_imprv
			from ''' + @szBCPFile + '''
			with ( maxerrors = 0, tablock )
		'
	end
	else
	begin
		set @szSQL = '
			bulk insert recalc_trace_imprv
			from ''' + @szBCPFile + '''
			with ( maxerrors = 0 )
		'
	end

	exec(@szSQL)

GO


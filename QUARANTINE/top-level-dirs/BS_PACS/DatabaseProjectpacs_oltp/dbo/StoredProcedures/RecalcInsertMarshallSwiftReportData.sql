
create procedure RecalcInsertMarshallSwiftReportData
	@szBCPFile varchar(512),
	@bTableLock bit
as

set nocount on

	declare @szSQL varchar(512)

	if ( @bTableLock = 1 )
	begin
		set @szSQL = '
			bulk insert imprv_detail_ms_report_data
			from ''' + @szBCPFile + '''
			with ( maxerrors = 0, tablock )
		'
	end
	else
	begin
		set @szSQL = '
			bulk insert imprv_detail_ms_report_data
			from ''' + @szBCPFile + '''
			with ( maxerrors = 0 )
		'
	end

	exec(@szSQL)

GO


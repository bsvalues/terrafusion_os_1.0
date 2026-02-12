
create procedure RecalcInsertIncomeErrors
	@szBCPFile varchar(512),
	@bTableLock bit
as

set nocount on

	declare @szSQL varchar(512)

	if ( @bTableLock = 1 )
	begin
		set @szSQL = '
			bulk insert income_recalc_errors
			from ''' + @szBCPFile + '''
			with
			(
				maxerrors = 0,
				tablock
			)
		'
	end
	else
	begin
		set @szSQL = '
			bulk insert income_recalc_errors
			from ''' + @szBCPFile + '''
			with
			(
				maxerrors = 0
			)
		'
	end

	exec(@szSQL)

set nocount off

GO


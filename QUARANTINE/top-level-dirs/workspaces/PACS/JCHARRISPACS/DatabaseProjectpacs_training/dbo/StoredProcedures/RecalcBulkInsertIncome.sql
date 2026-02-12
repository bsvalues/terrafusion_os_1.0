
create procedure RecalcBulkInsertIncome
	@szBCPFile varchar(512)
as

set nocount on

	declare @szSQL varchar(512)

	set @szSQL = '
		bulk insert #recalc_bcp_income
		from ''' + @szBCPFile + '''
		with
		(
			maxerrors = 500000,
			tablock
		)
	'
	exec(@szSQL)

GO


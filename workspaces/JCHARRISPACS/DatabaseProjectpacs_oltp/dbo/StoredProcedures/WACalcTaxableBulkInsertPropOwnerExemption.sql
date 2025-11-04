
create procedure WACalcTaxableBulkInsertPropOwnerExemption
	@szBCPFileName varchar(256)
as

set nocount on

	declare @szSQL varchar(512)

	set @szSQL = '
		bulk insert wash_prop_owner_exemption
		from ''' + @szBCPFileName + '''
		with ( tablock )
	'
	
	exec(@szSQL)

GO


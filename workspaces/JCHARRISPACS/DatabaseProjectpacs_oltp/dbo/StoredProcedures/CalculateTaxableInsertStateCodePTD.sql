
create procedure CalculateTaxableInsertStateCodePTD
	@szBCPFileName_PTD varchar(256)
as

set nocount on

	declare @szSQL varchar(512)

	set @szSQL = '
		bulk insert property_owner_entity_state_cd
		from ''' + @szBCPFileName_PTD + '''
		with ( tablock )
	'
	exec(@szSQL)

GO




create procedure CalculateTaxableInsertTaxPreview
	@szBCPFileName varchar(256)
as

set nocount on

	declare @szSQL varchar(512)

	set @szSQL = '
		bulk insert property_entity_tax_preview
		from ''' + @szBCPFileName + '''
		with ( maxerrors = 0 )
	'

	exec(@szSQL)

GO


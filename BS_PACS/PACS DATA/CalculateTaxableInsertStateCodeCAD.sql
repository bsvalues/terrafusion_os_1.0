
create procedure CalculateTaxableInsertStateCodeCAD
	@szBCPFileName_CAD varchar(256)
as

set nocount on

	declare @szSQL varchar(512)

	set @szSQL = '
		bulk insert property_owner_entity_cad_state_cd
		from ''' + @szBCPFileName_CAD + '''
		with ( tablock )
	'
	exec(@szSQL)

GO


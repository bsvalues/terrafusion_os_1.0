

create procedure CalculateTaxableInsertExemption
	@lPacsUserID int,
	@szBCPFileName varchar(256)
as

set nocount on

	declare @szSQL varchar(512)

	if @lPacsUserID = 0
	begin
		set @szSQL = '
			bulk insert property_entity_exemption
			from ''' + @szBCPFileName + '''
			with ( tablock )
		'
	end
	else
	begin
		set @szSQL = '
			bulk insert property_entity_exemption_preview
			from ''' + @szBCPFileName + '''
			with ( tablock )
		'
	end

	exec(@szSQL)

GO


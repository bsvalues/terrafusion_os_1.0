

create procedure CalculateTaxableInsertEntityVal
	@lPacsUserID int,
	@szBCPFileName varchar(256)
as

set nocount on

	declare @szSQL varchar(512)

	if @lPacsUserID = 0
	begin
		set @szSQL = '
			bulk insert prop_owner_entity_val
			from ''' + @szBCPFileName + '''
			with ( tablock )
		'
	end
	else
	begin
		set @szSQL = '
			bulk insert prop_owner_entity_val_preview
			from ''' + @szBCPFileName + '''
			with ( tablock )
		'
	end

	exec(@szSQL)

GO





CREATE PROCEDURE InsertAbsSubdvWorksheetEntityAssoc

	@abs_subdv_cd varchar(10),
	@entity_type  varchar(10),
	@entities	  varchar(100)

AS
	declare @strSQL varchar(200)

	DELETE FROM abs_subdv_worksheet_entity_assoc
	WHERE abs_subdv_cd = @abs_subdv_cd
	AND entity_type = @entity_type

	set @strSQL = 'INSERT INTO abs_subdv_worksheet_entity_assoc '
	set @strSQL = @strSQL + 'SELECT ''' + @abs_subdv_cd + ''', entity_id, entity_type_cd '
	set @strSQL = @strSQL + 'FROM entity '
	set @strSQL = @strSQL + 'WHERE entity_cd IN (' + @entities + ') '


	exec(@strSQL)

GO


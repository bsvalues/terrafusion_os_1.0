


CREATE PROCEDURE DeleteAbsSubdvWorksheetPropAssoc

	@abs_subdv_cd 	varchar(10),
	@prop_id		int

AS 

	DELETE FROM abs_subdv_worksheet_prop_assoc
	WHERE abs_subdv_cd = @abs_subdv_cd
	AND prop_id = @prop_id

GO


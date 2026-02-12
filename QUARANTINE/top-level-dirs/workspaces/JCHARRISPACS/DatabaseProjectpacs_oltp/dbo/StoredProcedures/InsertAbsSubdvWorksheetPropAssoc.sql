


CREATE PROCEDURE InsertAbsSubdvWorksheetPropAssoc

	@abs_subdv_cd 		varchar(10),
	@prop_id 			int,
	@geo_id 			varchar(50),
	@date_entered 		varchar(10),
	@existing_acreage 	decimal(14,4),
	@deleted_acreage 	decimal(14,4),
	@remaining_acreage 	decimal(14,4)

AS

	IF NOT(EXISTS(SELECT prop_id
					FROM abs_subdv_worksheet_prop_assoc
					WHERE abs_subdv_cd = @abs_subdv_cd
					AND prop_id = @prop_id))
	BEGIN
		INSERT INTO abs_subdv_worksheet_prop_assoc
		(abs_subdv_cd, prop_id, geo_id, date_entered,
		existing_acreage, deleted_acreage, remaining_acreage)
		VALUES
		(@abs_subdv_cd, @prop_id, @geo_id, @date_entered,
		@existing_acreage, @deleted_acreage, @remaining_acreage)
	END

	ELSE
	BEGIN
		UPDATE abs_subdv_worksheet_prop_assoc
		SET geo_id = @geo_id,
			date_entered = @date_entered,
			existing_acreage = @existing_acreage,
			deleted_acreage = @deleted_acreage,
			remaining_acreage = @remaining_acreage
		WHERE abs_subdv_cd = @abs_subdv_cd
		AND prop_id = @prop_id
	END

GO


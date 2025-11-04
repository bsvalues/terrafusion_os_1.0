
CREATE PROCEDURE BuildingPermitTransfer
	@sourceBuildingPermit INT, -- the Building Permit that will be copied
	@sourceProperty INT, -- the Property from which the user chose to transfer the Building Permit
	@destinationProperty INT -- the Property to which the user chose to transfer the Building Permit

AS

SET NOCOUNT ON

-- create a tempoary table to hold IDs from the building_permit_worksheet table (related to this Building Permit)
DECLARE @sourceWorksheetIds TABLE
(
	id INT PRIMARY KEY IDENTITY,
	bp_worksheet_component_id INT
)

-- create a tempoary table to hold IDs that result from our process (destinations)
DECLARE @destinationWorksheetIds TABLE
(
	id INT PRIMARY KEY IDENTITY,
	bp_worksheet_component_id INT
)

-- declare variables
DECLARE @destinationBuildingPermit INT, -- the ID of the new/copied/transferred Building Permit
	@destinationWorksheet INT, -- whenever a building_permit_worksheet row is copied, this is where that copy went
	@max INT, -- number of iterations that should be performed
	@count INT,-- the current iteration (starting at 0)
	@worksheetComponentId INT, -- the current worksheet ID
	@customCriteria VARCHAR(MAX) -- space for any custom criteria we need to add

-- get the next Building Permit ID
EXEC @destinationBuildingPermit = GetUniqueIDRS 'building_permit', 1

-- copy the Building Permit and get the ID of the copy
EXEC SimpleCopySingleRow 'building_permit', 'bldg_permit_id', @sourceBuildingPermit, 0, '', @destinationBuildingPermit OUTPUT

-- now we need to copy all the Building Permit Worksheet rows that need to go with this Building Permit
-- so get all of them and hold them
INSERT @sourceWorksheetIds
SELECT bp_worksheet_component_id
FROM building_permit_worksheet
WHERE bldg_permit_id = @sourceBuildingPermit

-- in a moment when we start copying rows, we want to specify that we only care about entries in building_permit_worksheet about the source Building Permit
SET @customCriteria = 'bldg_permit_id = ' + CONVERT(VARCHAR(128), @sourceBuildingPermit)

-- get the counter ready
SET @count = 0
SET @max =
(
	SELECT COUNT(*)
	FROM @sourceWorksheetIds
)

-- begin the loop...
WHILE @count < @max
BEGIN
	SET @count = @count + 1

	SET @worksheetComponentId =
	(
		SELECT bp_worksheet_component_id
		FROM @sourceWorksheetIds
		WHERE id = @count
	)

	-- copy a row
	EXEC SimpleCopySingleRow 'building_permit_worksheet', 'bp_worksheet_component_id', @worksheetComponentId, 0, @customCriteria, @destinationWorksheet OUTPUT

	-- stick the resulting new row ID into a table because we'll have to update all of them in a sec
	INSERT @destinationWorksheetIds
	SELECT @destinationWorksheet
END

-- now that those worksheet rows are all copied, update them so that they're about the new/destination Building Permit
UPDATE building_permit_worksheet
SET bldg_permit_id = @destinationBuildingPermit
WHERE bp_worksheet_component_id IN
(
	SELECT bp_worksheet_component_id
	FROM @destinationWorksheetIds
)

-- the destination Building Permit must be set to Active
UPDATE building_permit
SET bldg_permit_active = 'T'
WHERE bldg_permit_id = @destinationBuildingPermit

-- the source Building Permit must be set to Inactive
UPDATE building_permit
SET bldg_permit_active = 'F'
WHERE bldg_permit_id = @sourceBuildingPermit

-- create the association between destination Property and Destination Building Permit
INSERT prop_building_permit_assoc
(
	bldg_permit_id,
	prop_id,
	primary_property
)
VALUES
(
	@destinationBuildingPermit,
	@destinationProperty,
	1
)

-- make sure this makes it into the change log
EXEC SetMachineLogChanges 1

-- add a record of this transfer to the building_permit_transfer table
INSERT building_permit_transfer
(
	source_building_permit,
	source_property,
	destination_building_permit,
	destination_property
)
VALUES
(
	@sourceBuildingPermit,
	@sourceProperty,
	@destinationBuildingPermit,
	@destinationProperty
)

-- change log not updating the source permit's deactivation, manually adding this to property level change log
DECLARE @tvar_lChangeID int

INSERT change_log with(rowlock) (lPacsUserID, szSQLAccount, szMachineName, dtChange, szChangeType, iTableID, iColumnID, szOldValue, szNewValue, szRefID )
VALUES (1, system_user, host_name(), getdate(), 'U', 141, 4026, 'T', convert(varchar(255), 'F'), 'Permit: ' + CONVERT(VARCHAR(128), @sourceBuildingPermit) + ' Inactive' )
SET @tvar_lChangeID = @@identity

INSERT change_log_keys with(rowlock) (lChangeID, iColumnID, szKeyValue, lKeyValue) values (@tvar_lChangeID, 4026, convert(varchar(24), @sourceProperty), @sourceProperty)


-- return the ID of the destination Building Permit
SELECT @destinationBuildingPermit

SET NOCOUNT OFF

GO


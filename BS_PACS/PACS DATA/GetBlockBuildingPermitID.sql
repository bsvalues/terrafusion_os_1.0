

-----------------------------------------------------------------------------
-- Procedure: GetBlockBuildingPermitID
--
-- Purpose: Get a block of building permit ids
-----------------------------------------------------------------------------
CREATE PROCEDURE GetBlockBuildingPermitID
	@count int,
	@first int output
AS

	exec dbo.GetUniqueID 'building_permit', @first output, @count, 0

	select first_id = @first

GO


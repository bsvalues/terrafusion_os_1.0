-- =============================================
-- Author:		Oleksandr Tedikov
-- Create date: 05/22/2008
-- Task #3359: Coding - Split Property Setup Dialog UI & Binding
-- Description:	Function gets all list of parent split/merges.
-- Test: select dbo.fn_GetParentSplitMergeIDs(3)
--select * from split_merge
-- =============================================
CREATE FUNCTION fn_GetParentSplitMergeIDs
(
	@split_merge_ID int
)
RETURNS varchar(max)
AS
BEGIN

DECLARE @ID int
DECLARE @IDList varchar(max)

SET @IDList = ','

WHILE(1 = 1)   --@ID != @parentID )
BEGIN

	SET @IDList = @IDList + CONVERT(varchar, @split_merge_ID) + ','

	SELECT @ID = parent_split_merge_id
	FROM split_merge
  WHERE split_merge_id = @split_merge_ID
	
	IF @id = @split_merge_ID or @ID is null
		BREAK

	SET @split_merge_ID = @ID
END

RETURN @IDList

END

GO


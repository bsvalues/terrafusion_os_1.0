CREATE PROCEDURE [dbo].[GetNameById]
@ItemID uniqueidentifier
AS
SELECT Path
FROM Catalog
WHERE ItemID = @ItemID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetNameById] TO [RSExecRole]
    AS [dbo];


GO


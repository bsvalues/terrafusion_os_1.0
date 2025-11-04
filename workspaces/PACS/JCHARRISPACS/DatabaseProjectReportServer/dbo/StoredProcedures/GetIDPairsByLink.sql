CREATE PROCEDURE [dbo].[GetIDPairsByLink]
@Link uniqueidentifier
AS
SELECT LinkSourceID, ItemID
FROM Catalog
WHERE LinkSourceID = @Link

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetIDPairsByLink] TO [RSExecRole]
    AS [dbo];


GO


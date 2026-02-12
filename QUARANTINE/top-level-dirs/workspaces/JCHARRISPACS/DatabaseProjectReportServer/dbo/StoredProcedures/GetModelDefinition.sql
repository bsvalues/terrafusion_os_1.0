CREATE PROCEDURE [dbo].[GetModelDefinition]
@CatalogItemID as uniqueidentifier
AS

SELECT
    C.[Content]
FROM
    [Catalog] AS C
WHERE
    C.[ItemID] = @CatalogItemID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetModelDefinition] TO [RSExecRole]
    AS [dbo];


GO


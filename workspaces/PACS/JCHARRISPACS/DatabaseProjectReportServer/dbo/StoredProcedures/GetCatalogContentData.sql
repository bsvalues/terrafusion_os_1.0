CREATE PROCEDURE [dbo].[GetCatalogContentData]
    @CatalogItemID uniqueidentifier
AS
BEGIN
    SELECT
        COALESCE(DATALENGTH([Content]), 0) AS ContentLength,
        [Content]
    FROM
        [Catalog]
    WHERE
        [ItemID] = @CatalogItemID
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetCatalogContentData] TO [RSExecRole]
    AS [dbo];


GO


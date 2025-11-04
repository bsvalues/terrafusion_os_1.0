CREATE PROCEDURE [dbo].[UpdateCatalogContentSize]
    @CatalogItemID UNIQUEIDENTIFIER,
    @ContentSize bigint
AS
BEGIN
    UPDATE
        [dbo].[Catalog]
    SET
        [ContentSize] = @ContentSize
    WHERE
        [ItemID] = @CatalogItemID
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateCatalogContentSize] TO [RSExecRole]
    AS [dbo];


GO


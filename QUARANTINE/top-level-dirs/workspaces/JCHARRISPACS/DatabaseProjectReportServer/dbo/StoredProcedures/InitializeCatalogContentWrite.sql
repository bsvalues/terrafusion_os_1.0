CREATE PROCEDURE [dbo].[InitializeCatalogContentWrite]
    @CatalogItemID uniqueidentifier
AS
BEGIN
    IF EXISTS (SELECT * FROM [dbo].[Catalog] WHERE [ItemID] = @CatalogItemID)
    BEGIN
        UPDATE
            [Catalog]
        SET
            [Content] = 0x
        WHERE [ItemID] = @CatalogItemID
    END
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[InitializeCatalogContentWrite] TO [RSExecRole]
    AS [dbo];


GO


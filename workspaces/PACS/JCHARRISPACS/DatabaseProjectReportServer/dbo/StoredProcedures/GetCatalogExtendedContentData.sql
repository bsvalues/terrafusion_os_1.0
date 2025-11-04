CREATE PROCEDURE [dbo].[GetCatalogExtendedContentData]
    @CatalogItemID UNIQUEIDENTIFIER,
    @ContentType VARCHAR(50)
AS
BEGIN
    SELECT
        DATALENGTH([Content]) AS ContentLength,
        [Content]
    FROM
        [CatalogItemExtendedContent]  WITH (READPAST) -- Ignoring rows that are in middle of a transaction
    WHERE
        [ItemID] = @CatalogItemID AND ContentType = @ContentType

END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetCatalogExtendedContentData] TO [RSExecRole]
    AS [dbo];


GO


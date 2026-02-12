CREATE PROCEDURE [dbo].[GetContentCache]
    @CatalogItemID uniqueidentifier,
    @ParamsHash int,
    @ContentType nvarchar(256)
AS
BEGIN
    DECLARE @now as DateTime
    SET @now = GETDATE()

    SELECT ContentCacheID, CatalogItemID, CreatedDate, ParamsHash, ExpirationDate, Version, ContentType, Content
    FROM [ReportServerTempDB].dbo.ContentCache WITH (NOLOCK)
    WHERE
        CatalogItemID = @CatalogItemID
        AND ParamsHash = @ParamsHash
        AND ContentType = @ContentType
        AND ExpirationDate > @now
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetContentCache] TO [RSExecRole]
    AS [dbo];


GO


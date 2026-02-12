CREATE PROCEDURE [dbo].[WriteCatalogContentChunk]
    @CatalogItemID uniqueidentifier,
    @Chunk varbinary(max),
    @Offset int,
    @Length int
AS
BEGIN
    UPDATE
        [Catalog]
    SET [Content]
        .WRITE(@Chunk, @Offset, @Length)
    WHERE [ItemID] = @CatalogItemID
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[WriteCatalogContentChunk] TO [RSExecRole]
    AS [dbo];


GO


CREATE PROCEDURE [dbo].[WriteCatalogExtendedContentChunkById]
    @Id bigint,
    @Chunk VARBINARY(max),
    @Offset INT,
    @Length INT
AS
BEGIN
    UPDATE
        [dbo].[CatalogItemExtendedContent]
    SET [Content]
        .WRITE(@Chunk, @Offset, @Length)
    WHERE
        [Id] = @Id
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[WriteCatalogExtendedContentChunkById] TO [RSExecRole]
    AS [dbo];


GO


CREATE PROCEDURE [dbo].[ReadChunkPortion]
@ChunkPointer binary(16),
@IsPermanentSnapshot bit,
@DataIndex int,
@Length int
AS

IF @IsPermanentSnapshot != 0 BEGIN
    READTEXT ChunkData.Content @ChunkPointer @DataIndex @Length
END ELSE BEGIN
    READTEXT [ReportServerTempDB].dbo.ChunkData.Content @ChunkPointer @DataIndex @Length
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[ReadChunkPortion] TO [RSExecRole]
    AS [dbo];


GO


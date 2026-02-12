CREATE PROCEDURE [dbo].[GetSnapshotChunks]
@SnapshotDataID uniqueidentifier,
@IsPermanentSnapshot bit
AS

IF @IsPermanentSnapshot != 0 BEGIN

SELECT ChunkName, ChunkType, ChunkFlags, MimeType, Version, datalength(Content)
FROM ChunkData
WHERE
    SnapshotDataID = @SnapshotDataID

END ELSE BEGIN

SELECT ChunkName, ChunkType, ChunkFlags, MimeType, Version, datalength(Content)
FROM [ReportServerTempDB].dbo.ChunkData
WHERE
    SnapshotDataID = @SnapshotDataID
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetSnapshotChunks] TO [RSExecRole]
    AS [dbo];


GO


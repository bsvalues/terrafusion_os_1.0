CREATE PROCEDURE [dbo].[UpdateSnapshotPaginationInfo]
@SnapshotDataID as uniqueidentifier,
@IsPermanentSnapshot as bit,
@PageCount as int,
@PaginationMode as smallint
AS
IF @IsPermanentSnapshot = 1
BEGIN
   UPDATE SnapshotData SET
    PageCount = @PageCount,
    PaginationMode = @PaginationMode
   WHERE SnapshotDataID = @SnapshotDataID
END ELSE BEGIN
   UPDATE [ReportServerTempDB].dbo.SnapshotData SET
    PageCount = @PageCount,
    PaginationMode = @PaginationMode
   WHERE SnapshotDataID = @SnapshotDataID
END

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateSnapshotPaginationInfo] TO [RSExecRole]
    AS [dbo];


GO


-- delete one historical snapshot
CREATE PROCEDURE [dbo].[DeleteHistoryRecord]
@ReportID uniqueidentifier,
@SnapshotDate DateTime
AS
SET NOCOUNT OFF
DELETE
FROM History
WHERE ReportID = @ReportID AND SnapshotDate = @SnapshotDate

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteHistoryRecord] TO [RSExecRole]
    AS [dbo];


GO


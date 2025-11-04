-- delete one historical snapshot by history id
CREATE PROCEDURE [dbo].[DeleteHistoryRecordByHistoryId]
@ReportID uniqueidentifier,
@HistoryId uniqueidentifier
AS
SET NOCOUNT OFF
DELETE
FROM History
WHERE ReportID = @ReportID AND HistoryId = @HistoryId

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteHistoryRecordByHistoryId] TO [RSExecRole]
    AS [dbo];


GO


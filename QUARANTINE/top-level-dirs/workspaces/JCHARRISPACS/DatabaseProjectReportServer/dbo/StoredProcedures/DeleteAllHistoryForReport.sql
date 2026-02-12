-- delete all snapshots for a report
CREATE PROCEDURE [dbo].[DeleteAllHistoryForReport]
@ReportID uniqueidentifier
AS
SET NOCOUNT OFF
DELETE
FROM History
WHERE HistoryID in
   (SELECT HistoryID
    FROM History JOIN Catalog on ItemID = ReportID
    WHERE ReportID = @ReportID
   )

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteAllHistoryForReport] TO [RSExecRole]
    AS [dbo];


GO


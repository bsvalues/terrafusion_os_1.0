CREATE PROCEDURE [dbo].[DeleteBatchRecords]
@BatchID uniqueidentifier
AS
SET NOCOUNT OFF
DELETE
FROM [Batch]
WHERE BatchID = @BatchID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteBatchRecords] TO [RSExecRole]
    AS [dbo];


GO


CREATE PROCEDURE [dbo].[GetBatchRecords]
@BatchID uniqueidentifier
AS
SELECT [Action], Item, Parent, Param, BoolParam, Content, Properties
FROM [Batch]
WHERE BatchID = @BatchID
ORDER BY AddedOn

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetBatchRecords] TO [RSExecRole]
    AS [dbo];


GO


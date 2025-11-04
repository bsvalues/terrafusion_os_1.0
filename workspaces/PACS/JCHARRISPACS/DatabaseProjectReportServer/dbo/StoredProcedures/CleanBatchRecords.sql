CREATE PROCEDURE [dbo].[CleanBatchRecords]
@MaxAgeMinutes int
AS
SET NOCOUNT OFF
DELETE FROM [Batch]
where BatchID in
   ( SELECT BatchID
     FROM [Batch]
     WHERE AddedOn < DATEADD(minute, -(@MaxAgeMinutes), GETUTCDATE()) )

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[CleanBatchRecords] TO [RSExecRole]
    AS [dbo];


GO


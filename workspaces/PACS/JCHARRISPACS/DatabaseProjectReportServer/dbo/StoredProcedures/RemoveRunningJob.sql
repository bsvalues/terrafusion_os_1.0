CREATE PROCEDURE [dbo].[RemoveRunningJob]
@JobID as nvarchar(32)
AS
SET NOCOUNT OFF
DELETE FROM RunningJobs WHERE JobID = @JobID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[RemoveRunningJob] TO [RSExecRole]
    AS [dbo];


GO


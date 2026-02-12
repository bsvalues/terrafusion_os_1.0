CREATE PROCEDURE [dbo].[UpdateRunningJob]
@JobID as nvarchar(32),
@JobStatus as smallint
AS
SET NOCOUNT OFF
UPDATE RunningJobs SET JobStatus = @JobStatus WHERE JobID = @JobID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateRunningJob] TO [RSExecRole]
    AS [dbo];


GO


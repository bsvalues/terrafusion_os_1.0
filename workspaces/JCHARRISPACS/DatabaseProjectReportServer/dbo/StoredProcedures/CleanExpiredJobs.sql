CREATE PROCEDURE [dbo].[CleanExpiredJobs]
AS
SET NOCOUNT OFF
DELETE FROM RunningJobs WHERE DATEADD(s, Timeout, StartDate) < GETDATE()

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[CleanExpiredJobs] TO [RSExecRole]
    AS [dbo];


GO


CREATE PROCEDURE [dbo].[ListRunningJobs]
AS
SELECT JobID, StartDate, ComputerName, RequestName, RequestPath, SUSER_SNAME(Users.[Sid]), Users.[UserName], Description,
    Timeout, JobAction, JobType, JobStatus, Users.[AuthType]
FROM RunningJobs
INNER JOIN Users
ON RunningJobs.UserID = Users.UserID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[ListRunningJobs] TO [RSExecRole]
    AS [dbo];


GO


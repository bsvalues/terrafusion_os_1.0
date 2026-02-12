CREATE PROCEDURE [dbo].[DeleteTask]
@ScheduleID uniqueidentifier
AS
SET NOCOUNT OFF
-- Delete the task with the given task id
DELETE FROM Schedule
WHERE [ScheduleID] = @ScheduleID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[DeleteTask] TO [RSExecRole]
    AS [dbo];


GO


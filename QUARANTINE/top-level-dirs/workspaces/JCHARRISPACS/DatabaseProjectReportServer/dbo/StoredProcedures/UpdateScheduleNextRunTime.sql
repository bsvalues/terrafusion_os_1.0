CREATE PROCEDURE [dbo].[UpdateScheduleNextRunTime]
@ScheduleID as uniqueidentifier,
@NextRunTime as datetime
as
update Schedule set [NextRunTime] = @NextRunTime where [ScheduleID] = @ScheduleID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[UpdateScheduleNextRunTime] TO [RSExecRole]
    AS [dbo];


GO


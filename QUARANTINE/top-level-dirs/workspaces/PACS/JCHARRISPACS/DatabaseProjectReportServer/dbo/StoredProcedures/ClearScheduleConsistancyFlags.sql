CREATE PROCEDURE [dbo].[ClearScheduleConsistancyFlags]
AS
update [Schedule] with (tablock, xlock) set [ConsistancyCheck] = NULL

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[ClearScheduleConsistancyFlags] TO [RSExecRole]
    AS [dbo];


GO


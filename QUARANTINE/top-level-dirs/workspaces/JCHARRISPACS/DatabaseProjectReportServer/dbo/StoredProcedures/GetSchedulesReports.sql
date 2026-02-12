CREATE PROCEDURE [dbo].[GetSchedulesReports]
@ID uniqueidentifier
AS

select
    C.Path
from
    ReportSchedule RS inner join Catalog C on (C.ItemID = RS.ReportID)
where
    ScheduleID = @ID

GO

GRANT EXECUTE
    ON OBJECT::[dbo].[GetSchedulesReports] TO [RSExecRole]
    AS [dbo];


GO


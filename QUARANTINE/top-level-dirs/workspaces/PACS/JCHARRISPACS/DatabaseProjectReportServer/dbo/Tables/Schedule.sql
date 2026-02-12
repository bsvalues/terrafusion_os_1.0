CREATE TABLE [dbo].[Schedule] (
    [ScheduleID]          UNIQUEIDENTIFIER NOT NULL,
    [Name]                NVARCHAR (260)   NOT NULL,
    [StartDate]           DATETIME         NOT NULL,
    [Flags]               INT              NOT NULL,
    [NextRunTime]         DATETIME         NULL,
    [LastRunTime]         DATETIME         NULL,
    [EndDate]             DATETIME         NULL,
    [RecurrenceType]      INT              NULL,
    [MinutesInterval]     INT              NULL,
    [DaysInterval]        INT              NULL,
    [WeeksInterval]       INT              NULL,
    [DaysOfWeek]          INT              NULL,
    [DaysOfMonth]         INT              NULL,
    [Month]               INT              NULL,
    [MonthlyWeek]         INT              NULL,
    [State]               INT              NULL,
    [LastRunStatus]       NVARCHAR (260)   NULL,
    [ScheduledRunTimeout] INT              NULL,
    [CreatedById]         UNIQUEIDENTIFIER NOT NULL,
    [EventType]           NVARCHAR (260)   NOT NULL,
    [EventData]           NVARCHAR (260)   NULL,
    [Type]                INT              NOT NULL,
    [ConsistancyCheck]    DATETIME         NULL,
    [Path]                NVARCHAR (260)   NULL,
    CONSTRAINT [PK_ScheduleID] PRIMARY KEY CLUSTERED ([ScheduleID] ASC),
    CONSTRAINT [FK_Schedule_Users] FOREIGN KEY ([CreatedById]) REFERENCES [dbo].[Users] ([UserID]),
    CONSTRAINT [IX_Schedule] UNIQUE NONCLUSTERED ([Name] ASC, [Path] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_ScheduleForListTask]
    ON [dbo].[Schedule]([Type] ASC, [Path] ASC, [CreatedById] ASC)
    INCLUDE([Name], [StartDate], [Flags], [NextRunTime], [LastRunTime], [EndDate], [RecurrenceType], [MinutesInterval], [DaysInterval], [WeeksInterval], [DaysOfWeek], [DaysOfMonth], [Month], [MonthlyWeek], [State], [LastRunStatus], [ScheduledRunTimeout], [EventType], [EventData]);


GO


CREATE TRIGGER [dbo].[Schedule_UpdateExpiration] ON [dbo].[Schedule]  
AFTER UPDATE
AS 
UPDATE
   EC
SET
   AbsoluteExpiration = I.NextRunTime
FROM
   [ReportServerTempDB].dbo.ExecutionCache AS EC
   INNER JOIN ReportSchedule AS RS ON EC.ReportID = RS.ReportID
   INNER JOIN inserted AS I ON RS.ScheduleID = I.ScheduleID AND RS.ReportAction = 3

GO


CREATE TRIGGER [dbo].[Schedule_DeleteAgentJob] ON [dbo].[Schedule]  
AFTER DELETE
AS 
DECLARE id_cursor CURSOR
FOR
    SELECT ScheduleID from deleted
OPEN id_cursor

DECLARE @next_id uniqueidentifier
FETCH NEXT FROM id_cursor INTO @next_id
WHILE (@@FETCH_STATUS <> -1) -- -1 == FETCH statement failed or the row was beyond the result set.
BEGIN
    if (@@FETCH_STATUS <> -2) -- - 2 == Row fetched is missing.
    BEGIN
        exec msdb.dbo.sp_delete_job @job_name = @next_id -- delete the schedule
    END
    FETCH NEXT FROM id_cursor INTO @next_id
END
CLOSE id_cursor
DEALLOCATE id_cursor

GO

GRANT INSERT
    ON OBJECT::[dbo].[Schedule] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Schedule] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Schedule] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Schedule] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[Schedule] TO [RSExecRole]
    AS [dbo];


GO


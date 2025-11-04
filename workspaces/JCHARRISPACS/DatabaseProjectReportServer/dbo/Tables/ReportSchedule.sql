CREATE TABLE [dbo].[ReportSchedule] (
    [ScheduleID]     UNIQUEIDENTIFIER NOT NULL,
    [ReportID]       UNIQUEIDENTIFIER NOT NULL,
    [SubscriptionID] UNIQUEIDENTIFIER NULL,
    [ReportAction]   INT              NOT NULL,
    CONSTRAINT [FK_ReportSchedule_Report] FOREIGN KEY ([ReportID]) REFERENCES [dbo].[Catalog] ([ItemID]) ON DELETE CASCADE,
    CONSTRAINT [FK_ReportSchedule_Schedule] FOREIGN KEY ([ScheduleID]) REFERENCES [dbo].[Schedule] ([ScheduleID]) ON DELETE CASCADE,
    CONSTRAINT [FK_ReportSchedule_Subscriptions] FOREIGN KEY ([SubscriptionID]) REFERENCES [dbo].[Subscriptions] ([SubscriptionID]) NOT FOR REPLICATION
);


GO
ALTER TABLE [dbo].[ReportSchedule] NOCHECK CONSTRAINT [FK_ReportSchedule_Subscriptions];


GO

CREATE NONCLUSTERED INDEX [IX_ReportSchedule_ScheduleID]
    ON [dbo].[ReportSchedule]([ScheduleID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_ReportSchedule_SubscriptionID]
    ON [dbo].[ReportSchedule]([SubscriptionID] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_ReportSchedule_ReportID]
    ON [dbo].[ReportSchedule]([ReportID] ASC);


GO


CREATE TRIGGER [dbo].[ReportSchedule_Schedule] ON [dbo].[ReportSchedule]
AFTER DELETE
AS

-- if the deleted row is the last connection between a schedule and a report delete the schedule
-- as long as the schedule is not a shared schedule (type == 0)
delete [Schedule] from 
    [Schedule] S inner join deleted D on S.[ScheduleID] = D.[ScheduleID] 
where
    S.[Type] != 0 and
    not exists (select * from [ReportSchedule] R where S.[ScheduleID] = R.[ScheduleID])

GO

GRANT REFERENCES
    ON OBJECT::[dbo].[ReportSchedule] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[ReportSchedule] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[ReportSchedule] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[ReportSchedule] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[ReportSchedule] TO [RSExecRole]
    AS [dbo];


GO


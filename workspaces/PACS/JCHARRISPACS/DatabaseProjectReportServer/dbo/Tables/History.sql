CREATE TABLE [dbo].[History] (
    [HistoryID]      UNIQUEIDENTIFIER NOT NULL,
    [ReportID]       UNIQUEIDENTIFIER NOT NULL,
    [SnapshotDataID] UNIQUEIDENTIFIER NOT NULL,
    [SnapshotDate]   DATETIME         NOT NULL,
    CONSTRAINT [PK_History] PRIMARY KEY NONCLUSTERED ([HistoryID] ASC)
);


GO

CREATE UNIQUE CLUSTERED INDEX [IX_History]
    ON [dbo].[History]([ReportID] ASC, [SnapshotDate] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_SnapshotDataID]
    ON [dbo].[History]([SnapshotDataID] ASC);


GO


CREATE TRIGGER [dbo].[HistoryDelete_SnapshotRefcount] ON [dbo].[History] 
AFTER DELETE
AS
   UPDATE [dbo].[SnapshotData]
   SET [PermanentRefcount] = [PermanentRefcount] - 1
   FROM [SnapshotData] SD INNER JOIN deleted D on SD.[SnapshotDataID] = D.[SnapshotDataID]

GO


CREATE TRIGGER [dbo].[History_Notifications] ON [dbo].[History]  
AFTER INSERT
AS 
   insert
      into [dbo].[Event]
      ([EventID], [EventType], [EventData], [TimeEntered]) 
      select NewID(), 'ReportHistorySnapshotCreated', inserted.[HistoryID], GETUTCDATE()
   from inserted

GO

GRANT SELECT
    ON OBJECT::[dbo].[History] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[History] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[History] TO [RSExecRole]
    AS [dbo];


GO

GRANT DELETE
    ON OBJECT::[dbo].[History] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[History] TO [RSExecRole]
    AS [dbo];


GO


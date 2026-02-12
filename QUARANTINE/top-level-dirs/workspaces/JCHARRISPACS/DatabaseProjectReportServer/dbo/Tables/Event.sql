CREATE TABLE [dbo].[Event] (
    [EventID]          UNIQUEIDENTIFIER NOT NULL,
    [EventType]        NVARCHAR (260)   NOT NULL,
    [EventData]        NVARCHAR (260)   NULL,
    [TimeEntered]      DATETIME         NOT NULL,
    [ProcessStart]     DATETIME         NULL,
    [ProcessHeartbeat] DATETIME         NULL,
    [BatchID]          UNIQUEIDENTIFIER NULL,
    CONSTRAINT [PK_Event] PRIMARY KEY CLUSTERED ([EventID] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_Event2]
    ON [dbo].[Event]([ProcessStart] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_Event_TimeEntered]
    ON [dbo].[Event]([TimeEntered] ASC);


GO

GRANT DELETE
    ON OBJECT::[dbo].[Event] TO [RSExecRole]
    AS [dbo];


GO

GRANT SELECT
    ON OBJECT::[dbo].[Event] TO [RSExecRole]
    AS [dbo];


GO

GRANT UPDATE
    ON OBJECT::[dbo].[Event] TO [RSExecRole]
    AS [dbo];


GO

GRANT INSERT
    ON OBJECT::[dbo].[Event] TO [RSExecRole]
    AS [dbo];


GO

GRANT REFERENCES
    ON OBJECT::[dbo].[Event] TO [RSExecRole]
    AS [dbo];


GO


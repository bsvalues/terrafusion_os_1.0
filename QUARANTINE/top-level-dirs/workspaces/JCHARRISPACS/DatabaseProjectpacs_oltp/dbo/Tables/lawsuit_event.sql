CREATE TABLE [dbo].[lawsuit_event] (
    [lawsuit_id]    INT           NOT NULL,
    [event_id]      INT           IDENTITY (100000, 1) NOT NULL,
    [event_dt]      DATETIME      NULL,
    [event_cd]      VARCHAR (10)  NULL,
    [event_due_dt]  DATETIME      NULL,
    [event_comment] VARCHAR (500) NULL,
    CONSTRAINT [CPK_lawsuit_event] PRIMARY KEY CLUSTERED ([lawsuit_id] ASC, [event_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_lawsuit_event_event_cd] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[lawsuit_event_type] ([event_cd])
);


GO


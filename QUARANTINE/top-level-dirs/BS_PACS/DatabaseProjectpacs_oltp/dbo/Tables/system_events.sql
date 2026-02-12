CREATE TABLE [dbo].[system_events] (
    [event_cd]      CHAR (5)       NOT NULL,
    [event_desc]    VARCHAR (2048) NOT NULL,
    [event_date]    DATETIME       NOT NULL,
    [event_user_id] INT            NOT NULL,
    [event_id]      INT            NOT NULL,
    CONSTRAINT [CPK_system_events] PRIMARY KEY CLUSTERED ([event_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_system_events_event_cd] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[system_event_type] ([event_type_cd])
);


GO


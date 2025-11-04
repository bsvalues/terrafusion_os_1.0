CREATE TABLE [dbo].[system_event_type] (
    [event_type_cd]   CHAR (5)      NOT NULL,
    [event_type_desc] VARCHAR (255) NULL,
    CONSTRAINT [CPK_system_event_type] PRIMARY KEY CLUSTERED ([event_type_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


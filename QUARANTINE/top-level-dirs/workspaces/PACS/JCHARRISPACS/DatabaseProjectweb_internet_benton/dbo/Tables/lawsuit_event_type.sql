CREATE TABLE [dbo].[lawsuit_event_type] (
    [event_cd]   VARCHAR (10) NOT NULL,
    [event_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_lawsuit_event_type] PRIMARY KEY CLUSTERED ([event_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


CREATE TABLE [dbo].[event_source_type] (
    [event_source_cd]          VARCHAR (20) NOT NULL,
    [event_source_description] VARCHAR (50) NOT NULL,
    CONSTRAINT [PK_event_source_type] PRIMARY KEY CLUSTERED ([event_source_cd] ASC)
);


GO


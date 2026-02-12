CREATE TABLE [dbo].[arbitration_event_type] (
    [event_type_cd] VARCHAR (10) NOT NULL,
    [event_desc]    VARCHAR (50) NULL,
    [sys_flag]      BIT          NULL,
    CONSTRAINT [CPK_arbitration_event_type] PRIMARY KEY CLUSTERED ([event_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


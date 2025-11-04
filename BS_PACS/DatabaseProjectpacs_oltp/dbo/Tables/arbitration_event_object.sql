CREATE TABLE [dbo].[arbitration_event_object] (
    [event_object_id] INT           IDENTITY (1, 1) NOT NULL,
    [event_id]        INT           NOT NULL,
    [object_dt]       DATETIME      NOT NULL,
    [object_path]     VARCHAR (512) NOT NULL,
    [object_desc]     VARCHAR (512) NULL,
    [pacs_user_id]    INT           NOT NULL,
    CONSTRAINT [CPK_arbitration_event_object] PRIMARY KEY CLUSTERED ([event_object_id] ASC)
);


GO


CREATE TABLE [dbo].[litigation_event_objects] (
    [litigation_event_object_id] INT           NOT NULL,
    [litigation_event_id]        INT           NOT NULL,
    [date_created]               DATETIME      NOT NULL,
    [pacs_user_id]               INT           NOT NULL,
    [object_path]                VARCHAR (512) NOT NULL,
    [object_desc]                VARCHAR (512) NULL,
    CONSTRAINT [CPK_litigation_event_objects] PRIMARY KEY CLUSTERED ([litigation_event_object_id] ASC),
    CONSTRAINT [CFK_litigation_event_objects_litigation_events] FOREIGN KEY ([litigation_event_id]) REFERENCES [dbo].[litigation_events] ([litigation_event_id])
);


GO


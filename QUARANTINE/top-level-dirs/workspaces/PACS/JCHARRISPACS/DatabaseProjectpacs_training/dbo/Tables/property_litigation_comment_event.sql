CREATE TABLE [dbo].[property_litigation_comment_event] (
    [property_litigation_comment_event_id] INT           IDENTITY (100000, 1) NOT NULL,
    [prop_id]                              INT           NOT NULL,
    [litigation_id]                        INT           NOT NULL,
    [event_dt]                             DATETIME      NULL,
    [pacs_user_id]                         INT           NULL,
    [event_cd]                             VARCHAR (20)  NULL,
    [comments]                             VARCHAR (512) NULL,
    CONSTRAINT [CPK_property_litigation_comment_event] PRIMARY KEY CLUSTERED ([property_litigation_comment_event_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_property_litigation_comment_event_litigation] FOREIGN KEY ([litigation_id]) REFERENCES [dbo].[litigation] ([litigation_id]),
    CONSTRAINT [CFK_property_litigation_comment_event_property] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id]),
    CONSTRAINT [CFK_property_litigation_comment_event_property_litigation_comment_event_type] FOREIGN KEY ([event_cd]) REFERENCES [dbo].[property_litigation_comment_event_type] ([property_litigation_comment_event_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Store', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'property_litigation_comment_event';


GO


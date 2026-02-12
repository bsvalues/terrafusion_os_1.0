CREATE TABLE [dbo].[meta_object_button_publication] (
    [button_id]   INT           NOT NULL,
    [object_type] INT           NOT NULL,
    [sub_type]    INT           NOT NULL,
    [role]        INT           NOT NULL,
    [role_type]   INT           NOT NULL,
    [workflow]    INT           NOT NULL,
    [activity]    INT           NOT NULL,
    [verb]        INT           NULL,
    [description] VARCHAR (255) NULL,
    CONSTRAINT [CPK_meta_object_button_publication] PRIMARY KEY CLUSTERED ([button_id] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC)
);


GO


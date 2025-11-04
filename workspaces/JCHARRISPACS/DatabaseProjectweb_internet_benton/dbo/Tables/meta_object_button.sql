CREATE TABLE [dbo].[meta_object_button] (
    [button_id]        INT           IDENTITY (1, 1) NOT NULL,
    [caption]          VARCHAR (255) NOT NULL,
    [parent_button_id] INT           NULL,
    [System]           BIT           NOT NULL,
    CONSTRAINT [CPK_meta_object_button] PRIMARY KEY CLUSTERED ([button_id] ASC) WITH (FILLFACTOR = 100)
);


GO


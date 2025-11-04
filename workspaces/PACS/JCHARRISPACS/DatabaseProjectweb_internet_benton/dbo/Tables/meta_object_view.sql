CREATE TABLE [dbo].[meta_object_view] (
    [meta_object_view_id] INT           IDENTITY (1, 1) NOT NULL,
    [type]                VARCHAR (255) NOT NULL,
    [system]              BIT           NOT NULL,
    CONSTRAINT [CPK_meta_object_view] PRIMARY KEY CLUSTERED ([meta_object_view_id] ASC)
);


GO


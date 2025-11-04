CREATE TABLE [dbo].[meta_dialog_view] (
    [meta_dialog_view_id] INT           IDENTITY (1, 1) NOT NULL,
    [type]                VARCHAR (255) NOT NULL,
    [system]              BIT           NOT NULL,
    [object_type]         INT           NOT NULL,
    [sub_type]            INT           NOT NULL,
    [role]                INT           NOT NULL,
    [workflow]            INT           NOT NULL,
    [activity]            INT           NOT NULL,
    CONSTRAINT [CPK_meta_dialog_view] PRIMARY KEY CLUSTERED ([meta_dialog_view_id] ASC)
);


GO


CREATE TABLE [dbo].[meta_object_view_panel] (
    [meta_object_view_id] INT           NOT NULL,
    [object_type]         INT           NOT NULL,
    [sub_type]            INT           NOT NULL,
    [role_type]           INT           NOT NULL,
    [role]                INT           NOT NULL,
    [workflow]            INT           NOT NULL,
    [activity]            INT           NOT NULL,
    [panel]               VARCHAR (255) NOT NULL,
    [caption]             VARCHAR (255) NOT NULL,
    [primary]             BIT           NOT NULL,
    [row]                 INT           NOT NULL,
    [system]              BIT           NOT NULL,
    CONSTRAINT [CPK_meta_object_view_panel] PRIMARY KEY CLUSTERED ([meta_object_view_id] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC, [panel] ASC)
);


GO


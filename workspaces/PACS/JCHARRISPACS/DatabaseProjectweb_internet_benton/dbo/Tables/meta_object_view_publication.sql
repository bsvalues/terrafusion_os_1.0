CREATE TABLE [dbo].[meta_object_view_publication] (
    [meta_object_view_id] INT NOT NULL,
    [object_type]         INT NOT NULL,
    [sub_type]            INT NOT NULL,
    [role]                INT NOT NULL,
    [role_type]           INT NOT NULL,
    [workflow]            INT NOT NULL,
    [activity]            INT NOT NULL,
    [system]              BIT NOT NULL,
    CONSTRAINT [CPK_meta_object_view_publication] PRIMARY KEY CLUSTERED ([meta_object_view_id] ASC, [object_type] ASC, [sub_type] ASC, [role] ASC, [role_type] ASC, [workflow] ASC, [activity] ASC)
);


GO


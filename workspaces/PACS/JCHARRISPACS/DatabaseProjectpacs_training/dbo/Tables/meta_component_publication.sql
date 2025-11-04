CREATE TABLE [dbo].[meta_component_publication] (
    [component_id] INT NOT NULL,
    [object_type]  INT CONSTRAINT [CDF_meta_component_publication_object_type] DEFAULT ((-1)) NOT NULL,
    [sub_type]     INT CONSTRAINT [CDF_meta_component_publication_sub_type] DEFAULT ((-1)) NOT NULL,
    [role_type]    INT CONSTRAINT [CDF_meta_component_publication_role_type] DEFAULT ((-1)) NOT NULL,
    [role]         INT CONSTRAINT [CDF_meta_component_publication_role] DEFAULT ((-1)) NOT NULL,
    [workflow]     INT CONSTRAINT [CDF_meta_component_publication_workflow] DEFAULT ((-1)) NOT NULL,
    [activity]     INT CONSTRAINT [CDF_meta_component_publication_activity] DEFAULT ((-1)) NOT NULL,
    CONSTRAINT [CPK_meta_component_publication] PRIMARY KEY CLUSTERED ([component_id] ASC, [object_type] ASC, [sub_type] ASC, [role_type] ASC, [role] ASC, [workflow] ASC, [activity] ASC),
    CONSTRAINT [CFK_meta_component_publication_object_type] FOREIGN KEY ([object_type]) REFERENCES [dbo].[meta_object_type] ([object_type_id]),
    CONSTRAINT [CFK_meta_component_publication_sub_type] FOREIGN KEY ([sub_type]) REFERENCES [dbo].[meta_sub_type] ([sub_type_id])
);


GO


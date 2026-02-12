CREATE TABLE [dbo].[meta_component_level_role] (
    [component_level_id] INT NOT NULL,
    [role_type]          INT NOT NULL,
    CONSTRAINT [CPK_meta_component_level_role] PRIMARY KEY CLUSTERED ([component_level_id] ASC, [role_type] ASC)
);


GO


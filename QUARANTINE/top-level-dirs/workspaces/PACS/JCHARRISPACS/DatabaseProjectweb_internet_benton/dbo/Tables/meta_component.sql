CREATE TABLE [dbo].[meta_component] (
    [component_id]   INT NOT NULL,
    [component_type] INT NOT NULL,
    [component_verb] INT NOT NULL,
    CONSTRAINT [CPK_meta_component] PRIMARY KEY CLUSTERED ([component_id] ASC)
);


GO


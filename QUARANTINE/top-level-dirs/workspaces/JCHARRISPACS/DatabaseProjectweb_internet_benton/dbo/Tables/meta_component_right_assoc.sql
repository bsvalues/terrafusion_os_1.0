CREATE TABLE [dbo].[meta_component_right_assoc] (
    [component_id]   INT NOT NULL,
    [component_type] INT NOT NULL,
    [right_id]       INT NOT NULL,
    CONSTRAINT [CPK_meta_component_right_assoc] PRIMARY KEY CLUSTERED ([component_id] ASC, [component_type] ASC, [right_id] ASC)
);


GO


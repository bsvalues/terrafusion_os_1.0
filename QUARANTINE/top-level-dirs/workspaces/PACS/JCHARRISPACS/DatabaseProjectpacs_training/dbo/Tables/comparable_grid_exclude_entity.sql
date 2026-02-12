CREATE TABLE [dbo].[comparable_grid_exclude_entity] (
    [lEntityID] INT NOT NULL,
    CONSTRAINT [CPK_comparable_grid_exclude_entity] PRIMARY KEY CLUSTERED ([lEntityID] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_comparable_grid_exclude_entity_lEntityID] FOREIGN KEY ([lEntityID]) REFERENCES [dbo].[entity] ([entity_id]) ON DELETE CASCADE
);


GO


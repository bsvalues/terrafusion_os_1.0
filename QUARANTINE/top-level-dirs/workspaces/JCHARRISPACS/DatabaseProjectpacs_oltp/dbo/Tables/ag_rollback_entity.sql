CREATE TABLE [dbo].[ag_rollback_entity] (
    [prop_id]      INT NOT NULL,
    [owner_id]     INT NOT NULL,
    [ag_rollbk_id] INT NOT NULL,
    [entity_id]    INT NOT NULL,
    CONSTRAINT [CPK_ag_rollback_entity] PRIMARY KEY CLUSTERED ([prop_id] ASC, [owner_id] ASC, [ag_rollbk_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_ag_rollback_entity_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_ag_rollbk_id_prop_id]
    ON [dbo].[ag_rollback_entity]([ag_rollbk_id] ASC, [prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_entity_id]
    ON [dbo].[ag_rollback_entity]([entity_id] ASC) WITH (FILLFACTOR = 90);


GO


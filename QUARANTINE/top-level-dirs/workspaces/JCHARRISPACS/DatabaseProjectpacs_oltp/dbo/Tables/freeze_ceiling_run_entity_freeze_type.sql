CREATE TABLE [dbo].[freeze_ceiling_run_entity_freeze_type] (
    [run_id]      INT          NOT NULL,
    [entity_id]   INT          NOT NULL,
    [freeze_type] VARCHAR (10) NOT NULL,
    CONSTRAINT [CPK_freeze_ceiling_run_entity_freeze_type] PRIMARY KEY CLUSTERED ([freeze_type] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_freeze_ceiling_run_entity_freeze_type_entity_id] FOREIGN KEY ([entity_id]) REFERENCES [dbo].[entity] ([entity_id]),
    CONSTRAINT [CFK_freeze_ceiling_run_entity_freeze_type_freeze_type] FOREIGN KEY ([freeze_type]) REFERENCES [dbo].[exmpt_type] ([exmpt_type_cd]),
    CONSTRAINT [CFK_freeze_ceiling_run_entity_freeze_type_run_id] FOREIGN KEY ([run_id]) REFERENCES [dbo].[freeze_ceiling_run] ([run_id])
);


GO


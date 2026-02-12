CREATE TABLE [dbo].[tnt_export_entity] (
    [tnt_export_id] INT NOT NULL,
    [entity_id]     INT NOT NULL,
    CONSTRAINT [CPK_tnt_export_entity] PRIMARY KEY CLUSTERED ([tnt_export_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 90)
);


GO


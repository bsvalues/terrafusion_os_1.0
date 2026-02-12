CREATE TABLE [dbo].[mineral_import_utility_typickett] (
    [run_id] INT           NULL,
    [data]   VARCHAR (200) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_utility_typickett]([run_id] ASC) WITH (FILLFACTOR = 90);


GO


CREATE TABLE [dbo].[mineral_import_agent_data_pritchard_abbott] (
    [run_id] INT           NULL,
    [data]   VARCHAR (131) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_agent_data_pritchard_abbott]([run_id] ASC) WITH (FILLFACTOR = 90);


GO


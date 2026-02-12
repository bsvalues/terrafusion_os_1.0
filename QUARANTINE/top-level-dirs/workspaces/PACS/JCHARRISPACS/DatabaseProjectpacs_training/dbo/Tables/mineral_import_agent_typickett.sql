CREATE TABLE [dbo].[mineral_import_agent_typickett] (
    [run_id]      INT          NULL,
    [agent_code]  VARCHAR (3)  NULL,
    [agent_name]  VARCHAR (30) NULL,
    [address]     VARCHAR (30) NULL,
    [city]        VARCHAR (15) NULL,
    [state]       VARCHAR (2)  NULL,
    [postal_code] VARCHAR (9)  NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_agent_code]
    ON [dbo].[mineral_import_agent_typickett]([agent_code] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_agent_typickett]([run_id] ASC) WITH (FILLFACTOR = 90);


GO


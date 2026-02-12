CREATE TABLE [dbo].[mineral_import_agent_wardlaw] (
    [run_id]     INT          NULL,
    [agent_code] VARCHAR (6)  NULL,
    [agent_name] VARCHAR (30) NULL,
    [address]    VARCHAR (30) NULL,
    [city]       VARCHAR (16) NULL,
    [state]      VARCHAR (2)  NULL,
    [zip_code]   VARCHAR (10) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_agent_wardlaw]([run_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_agent_code]
    ON [dbo].[mineral_import_agent_wardlaw]([agent_code] ASC) WITH (FILLFACTOR = 90);


GO


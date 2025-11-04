CREATE TABLE [dbo].[mineral_import_agent_capitol] (
    [run_id]        INT          NULL,
    [client_number] VARCHAR (3)  NULL,
    [agent_code]    VARCHAR (3)  NULL,
    [agent_name]    VARCHAR (30) NULL,
    [address_one]   VARCHAR (30) NULL,
    [address_two]   VARCHAR (30) NULL,
    [city]          VARCHAR (16) NULL,
    [state]         VARCHAR (2)  NULL,
    [zip_code]      VARCHAR (10) NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_agent_capitol]([run_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_agent_code]
    ON [dbo].[mineral_import_agent_capitol]([agent_code] ASC) WITH (FILLFACTOR = 90);


GO


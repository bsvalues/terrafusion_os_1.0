CREATE TABLE [dbo].[mineral_import_agent_pritchard_abbott] (
    [run_id]       INT          NULL,
    [agent_number] VARCHAR (3)  NULL,
    [agent_name]   VARCHAR (30) NULL,
    [agent_firm]   VARCHAR (30) NULL,
    [street]       VARCHAR (30) NULL,
    [city]         VARCHAR (16) NULL,
    [state]        VARCHAR (2)  NULL,
    [zip]          VARCHAR (5)  NULL,
    [dash]         VARCHAR (1)  NULL,
    [plus_four]    VARCHAR (4)  NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_agent_pritchard_abbott]([run_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_agent_number]
    ON [dbo].[mineral_import_agent_pritchard_abbott]([agent_number] ASC) WITH (FILLFACTOR = 90);


GO


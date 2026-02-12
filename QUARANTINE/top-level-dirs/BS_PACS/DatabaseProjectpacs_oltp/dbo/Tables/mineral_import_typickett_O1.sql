CREATE TABLE [dbo].[mineral_import_typickett_O1] (
    [run_id]             INT            NULL,
    [id]                 VARCHAR (2)    NULL,
    [lease_nbr]          VARCHAR (5)    NULL,
    [owner_nbr]          VARCHAR (7)    NULL,
    [interest_type]      VARCHAR (2)    NULL,
    [owner_rest]         VARCHAR (30)   NULL,
    [address1]           VARCHAR (30)   NULL,
    [address2]           VARCHAR (30)   NULL,
    [city]               VARCHAR (15)   NULL,
    [st]                 VARCHAR (2)    NULL,
    [zip]                VARCHAR (5)    NULL,
    [zip_4]              VARCHAR (4)    NULL,
    [agent]              VARCHAR (2)    NULL,
    [schx]               VARCHAR (1)    NULL,
    [cnt]                VARCHAR (1)    NULL,
    [sch]                VARCHAR (1)    NULL,
    [cty]                VARCHAR (1)    NULL,
    [jrc]                VARCHAR (1)    NULL,
    [rend]               VARCHAR (1)    NULL,
    [interest]           NUMERIC (6, 6) NULL,
    [value]              NUMERIC (11)   NULL,
    [raw_value]          NUMERIC (11)   NULL,
    [chg_date]           DATETIME       NULL,
    [geo_id]             VARCHAR (50)   NULL,
    [legal_desc]         VARCHAR (255)  NULL,
    [converted_interest] AS             (case when ([interest] >= 1.0) then (convert(varchar(12),[interest])) else (substring(convert(varchar(12),[interest]),charindex('.',convert(varchar(12),[interest])),12)) end),
    [agent_authority]    VARCHAR (1)    NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_agent]
    ON [dbo].[mineral_import_typickett_O1]([agent] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_typickett_O1]([run_id] ASC) WITH (FILLFACTOR = 90);


GO


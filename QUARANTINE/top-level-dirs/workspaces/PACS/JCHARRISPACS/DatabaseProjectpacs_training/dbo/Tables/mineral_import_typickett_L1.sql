CREATE TABLE [dbo].[mineral_import_typickett_L1] (
    [run_id]     INT          NULL,
    [rec_id]     VARCHAR (2)  NULL,
    [lease]      VARCHAR (5)  NULL,
    [sch]        VARCHAR (2)  NULL,
    [wtr]        VARCHAR (2)  NULL,
    [rod]        VARCHAR (2)  NULL,
    [cty]        VARCHAR (2)  NULL,
    [nuprop]     VARCHAR (1)  NULL,
    [m1]         VARCHAR (2)  NULL,
    [m2]         VARCHAR (2)  NULL,
    [m3]         VARCHAR (2)  NULL,
    [m4]         VARCHAR (2)  NULL,
    [operator]   VARCHAR (22) NULL,
    [lease_name] VARCHAR (22) NULL,
    [field_name] VARCHAR (26) NULL,
    [abst]       VARCHAR (10) NULL,
    [block]      VARCHAR (8)  NULL,
    [section]    VARCHAR (7)  NULL,
    [acres]      VARCHAR (6)  NULL,
    [excl_val]   INT          NULL,
    [min_val]    INT          NULL,
    [geo_info]   AS           (case (rtrim(isnull([abst],''))) when '' then '' else ('ABST ' + rtrim([abst])) end + case (rtrim(isnull([block],''))) when '' then '' else (', BLOCK ' + rtrim([block])) end + case (rtrim(isnull([section],''))) when '' then '' else (', SECTION ' + rtrim([section])) end + case (rtrim(isnull([acres],''))) when '' then '' else (', ACRES ' + rtrim([acres])) end)
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_typickett_L1]([run_id] ASC) WITH (FILLFACTOR = 90);


GO


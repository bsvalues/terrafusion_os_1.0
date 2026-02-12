CREATE TABLE [dbo].[mineral_import_utility_typickett_N] (
    [run_id]     INT            NULL,
    [id]         VARCHAR (1)    NULL,
    [owner_nbr]  VARCHAR (7)    NULL,
    [item_nbr]   VARCHAR (3)    NULL,
    [seq_nbr]    VARCHAR (4)    NULL,
    [sch]        VARCHAR (1)    NULL,
    [wtr]        VARCHAR (1)    NULL,
    [cty]        VARCHAR (1)    NULL,
    [m1]         VARCHAR (1)    NULL,
    [m2]         VARCHAR (1)    NULL,
    [m3]         VARCHAR (1)    NULL,
    [m4]         VARCHAR (1)    NULL,
    [m5]         VARCHAR (1)    NULL,
    [abst]       VARCHAR (10)   NULL,
    [blck]       VARCHAR (8)    NULL,
    [sect]       VARCHAR (7)    NULL,
    [acrsb]      NUMERIC (7, 2) NULL,
    [des1]       VARCHAR (35)   NULL,
    [des2]       VARCHAR (35)   NULL,
    [des3]       VARCHAR (35)   NULL,
    [real]       NUMERIC (11)   NULL,
    [pers]       NUMERIC (11)   NULL,
    [cnty]       VARCHAR (3)    NULL,
    [spcl_code]  VARCHAR (2)    NULL,
    [nuprop]     VARCHAR (1)    NULL,
    [gov_code]   VARCHAR (2)    NULL,
    [geo_id]     VARCHAR (50)   NULL,
    [legal_desc] VARCHAR (255)  NULL
);


GO

CREATE NONCLUSTERED INDEX [idx_run_id]
    ON [dbo].[mineral_import_utility_typickett_N]([run_id] ASC) WITH (FILLFACTOR = 90);


GO


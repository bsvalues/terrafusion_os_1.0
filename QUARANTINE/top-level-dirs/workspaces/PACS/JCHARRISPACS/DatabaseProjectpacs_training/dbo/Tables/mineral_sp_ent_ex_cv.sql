CREATE TABLE [dbo].[mineral_sp_ent_ex_cv] (
    [prop_id]       INT             NOT NULL,
    [owner_id]      INT             NOT NULL,
    [sup_num]       INT             NOT NULL,
    [exmpt_tax_yr]  NUMERIC (4)     NOT NULL,
    [owner_tax_yr]  NUMERIC (4)     NOT NULL,
    [exmpt_type_cd] CHAR (5)        NOT NULL,
    [entity_id]     INT             NOT NULL,
    [entity_code]   VARCHAR (10)    NULL,
    [sp_amt]        NUMERIC (14, 2) NULL,
    [sp_pct]        NUMERIC (5, 2)  NULL,
    [xref]          VARCHAR (25)    NULL
);


GO

CREATE CLUSTERED INDEX [idx_xref]
    ON [dbo].[mineral_sp_ent_ex_cv]([xref] ASC) WITH (FILLFACTOR = 90);


GO


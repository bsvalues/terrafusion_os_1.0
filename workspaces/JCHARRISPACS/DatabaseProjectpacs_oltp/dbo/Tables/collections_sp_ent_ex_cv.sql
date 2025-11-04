CREATE TABLE [dbo].[collections_sp_ent_ex_cv] (
    [prop_id]       INT             NOT NULL,
    [owner_id]      INT             NOT NULL,
    [sup_num]       INT             NOT NULL,
    [exmpt_tax_yr]  NUMERIC (4)     NOT NULL,
    [owner_tax_yr]  NUMERIC (4)     NOT NULL,
    [exmpt_type_cd] CHAR (5)        NOT NULL,
    [entity_id]     INT             NOT NULL,
    [sp_amt]        NUMERIC (14, 2) NULL,
    [sp_pct]        NUMERIC (5, 2)  NULL,
    CONSTRAINT [CPK_collections_sp_ent_ex_cv] PRIMARY KEY NONCLUSTERED ([prop_id] ASC, [owner_id] ASC, [sup_num] ASC, [exmpt_tax_yr] ASC, [owner_tax_yr] ASC, [exmpt_type_cd] ASC, [entity_id] ASC) WITH (FILLFACTOR = 90)
);


GO


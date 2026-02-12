CREATE TABLE [dbo].[update_freeze] (
    [prop_id]       INT             NOT NULL,
    [owner_id]      INT             NOT NULL,
    [entity_id]     INT             NOT NULL,
    [sup_num]       INT             NOT NULL,
    [prop_val_yr]   NUMERIC (4)     NOT NULL,
    [tax_amt]       NUMERIC (14, 2) NULL,
    [prev_tax_amt]  NUMERIC (14, 2) NULL,
    [poev_assessed] NUMERIC (14)    NULL,
    [poev_taxable]  NUMERIC (14)    NULL,
    [exmpt_type_cd] VARCHAR (10)    NOT NULL,
    [pacs_run_id]   INT             NULL,
    CONSTRAINT [CPK_update_freeze] PRIMARY KEY CLUSTERED ([prop_id] ASC, [prop_val_yr] ASC, [sup_num] ASC, [owner_id] ASC, [entity_id] ASC, [exmpt_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


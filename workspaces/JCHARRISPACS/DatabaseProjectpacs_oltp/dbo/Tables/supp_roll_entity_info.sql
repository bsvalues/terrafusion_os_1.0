CREATE TABLE [dbo].[supp_roll_entity_info] (
    [sup_group_id]  INT             NULL,
    [prop_id]       INT             NULL,
    [owner_id]      INT             NULL,
    [entity_id]     INT             NULL,
    [sup_num]       INT             NULL,
    [sup_yr]        NUMERIC (4)     NULL,
    [curr_assessed] NUMERIC (14)    NULL,
    [curr_taxable]  NUMERIC (14)    NULL,
    [curr_tax_amt]  NUMERIC (14, 2) NULL,
    [prev_assessed] NUMERIC (14)    NULL,
    [prev_taxable]  NUMERIC (14)    NULL,
    [prev_tax_amt]  NUMERIC (14, 2) NULL,
    [lKey]          INT             IDENTITY (1, 1) NOT NULL,
    CONSTRAINT [CPK_supp_roll_entity_info] PRIMARY KEY CLUSTERED ([lKey] ASC) WITH (FILLFACTOR = 100)
);


GO


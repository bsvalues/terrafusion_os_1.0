CREATE TABLE [dbo].[transfer_tax_stmnt_fifth_yr_comparison] (
    [levy_group_id]     INT             NOT NULL,
    [levy_group_yr]     NUMERIC (4)     NOT NULL,
    [levy_run_id]       INT             NOT NULL,
    [prop_id]           INT             NOT NULL,
    [owner_id]          INT             NOT NULL,
    [sup_num]           INT             NOT NULL,
    [sup_tax_yr]        NUMERIC (4)     NOT NULL,
    [stmnt_id]          INT             NOT NULL,
    [hist_yr]           NUMERIC (4)     NOT NULL,
    [hist_entity_id]    INT             NOT NULL,
    [hist_stmnt_id]     INT             NOT NULL,
    [hist_entity_name]  VARCHAR (70)    NULL,
    [hist_assessed_val] NUMERIC (14, 2) NULL,
    [hist_taxable_val]  NUMERIC (14, 2) NULL,
    [hist_tax_rate]     NUMERIC (14, 2) NULL,
    [hist_tax_amt]      NUMERIC (14, 2) NULL,
    [bill_id]           INT             NOT NULL,
    [prev_bill_id]      INT             NOT NULL,
    CONSTRAINT [CPK_transfer_tax_stmnt_fifth_yr_comparison] PRIMARY KEY CLUSTERED ([levy_group_id] ASC, [levy_group_yr] ASC, [levy_run_id] ASC, [prop_id] ASC, [owner_id] ASC, [sup_num] ASC, [sup_tax_yr] ASC, [stmnt_id] ASC, [hist_yr] ASC, [hist_entity_id] ASC, [hist_stmnt_id] ASC, [bill_id] ASC, [prev_bill_id] ASC)
);


GO


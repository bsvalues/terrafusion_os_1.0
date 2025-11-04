CREATE TABLE [dbo].[delq_roll_totals] (
    [pacs_user_id]     INT             NOT NULL,
    [entity_id]        INT             NOT NULL,
    [sup_tax_yr]       NUMERIC (4)     NOT NULL,
    [num_bills]        INT             NULL,
    [base_tax_due]     NUMERIC (14, 2) NULL,
    [real_tax_due]     NUMERIC (14, 2) NULL,
    [mobile_tax_due]   NUMERIC (14, 2) NULL,
    [mineral_tax_due]  NUMERIC (14, 2) NULL,
    [personal_tax_due] NUMERIC (14, 2) NULL,
    [auto_tax_due]     NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_delq_roll_totals] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [sup_tax_yr] ASC) WITH (FILLFACTOR = 100)
);


GO


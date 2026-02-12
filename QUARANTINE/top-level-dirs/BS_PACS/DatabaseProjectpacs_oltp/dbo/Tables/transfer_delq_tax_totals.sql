CREATE TABLE [dbo].[transfer_delq_tax_totals] (
    [entity_id]     INT             NOT NULL,
    [entity_cd]     CHAR (5)        NULL,
    [entity_tax_yr] NUMERIC (4)     NOT NULL,
    [bill_count]    INT             NULL,
    [base_mno]      NUMERIC (14, 2) NULL,
    [base_ins]      NUMERIC (14, 2) NULL,
    [mno_due]       NUMERIC (14, 2) NULL,
    [ins_due]       NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_transfer_delq_tax_totals] PRIMARY KEY CLUSTERED ([entity_id] ASC, [entity_tax_yr] ASC) WITH (FILLFACTOR = 100)
);


GO


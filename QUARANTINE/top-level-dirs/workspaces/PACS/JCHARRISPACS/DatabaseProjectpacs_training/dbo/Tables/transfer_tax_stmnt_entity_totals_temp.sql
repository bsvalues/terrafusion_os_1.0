CREATE TABLE [dbo].[transfer_tax_stmnt_entity_totals_temp] (
    [levy_group_id] INT              NOT NULL,
    [levy_group_yr] NUMERIC (4)      NOT NULL,
    [levy_run_id]   INT              NOT NULL,
    [sup_num]       INT              NULL,
    [stmnt_id]      INT              NOT NULL,
    [entity_id]     INT              NOT NULL,
    [tax_amt]       NUMERIC (14, 2)  NOT NULL,
    [taxable_val]   NUMERIC (14)     NULL,
    [tax_rate]      NUMERIC (13, 10) NULL,
    CONSTRAINT [CPK_transfer_tax_stmnt_entity_totals_temp] PRIMARY KEY CLUSTERED ([levy_group_id] ASC, [levy_group_yr] ASC, [levy_run_id] ASC, [stmnt_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO


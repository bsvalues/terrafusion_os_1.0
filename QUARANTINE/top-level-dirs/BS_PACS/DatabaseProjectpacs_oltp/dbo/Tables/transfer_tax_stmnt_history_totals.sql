CREATE TABLE [dbo].[transfer_tax_stmnt_history_totals] (
    [levy_group_id]   INT              NOT NULL,
    [levy_group_yr]   NUMERIC (4)      NOT NULL,
    [levy_run_id]     INT              NOT NULL,
    [prop_id]         INT              NOT NULL,
    [owner_id]        INT              NOT NULL,
    [sup_num]         INT              NOT NULL,
    [sup_tax_yr]      NUMERIC (4)      NOT NULL,
    [stmnt_id]        INT              NOT NULL,
    [hist_yr]         NUMERIC (4)      NOT NULL,
    [hist_stmnt_id]   INT              NOT NULL,
    [hist_tax_rate]   NUMERIC (13, 10) NULL,
    [hist_tax_amnt]   NUMERIC (14, 2)  NULL,
    [hist_pct_change] NUMERIC (10, 2)  NULL,
    CONSTRAINT [CPK_transfer_tax_stmnt_history_totals] PRIMARY KEY CLUSTERED ([levy_group_id] ASC, [levy_group_yr] ASC, [levy_run_id] ASC, [prop_id] ASC, [owner_id] ASC, [sup_num] ASC, [sup_tax_yr] ASC, [stmnt_id] ASC, [hist_yr] ASC, [hist_stmnt_id] ASC)
);


GO


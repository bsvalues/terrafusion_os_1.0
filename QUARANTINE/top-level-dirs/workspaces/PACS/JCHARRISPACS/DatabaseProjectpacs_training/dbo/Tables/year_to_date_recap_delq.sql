CREATE TABLE [dbo].[year_to_date_recap_delq] (
    [pacs_user_id]  INT             NOT NULL,
    [entity_id]     INT             NOT NULL,
    [recap_yr]      NUMERIC (4)     NOT NULL,
    [orig_tax]      NUMERIC (14, 2) NULL,
    [adj_tax]       NUMERIC (14, 2) NULL,
    [tax_pd]        NUMERIC (14, 2) NULL,
    [disc_pd]       NUMERIC (14, 2) NULL,
    [penalty_pd]    NUMERIC (14, 2) NULL,
    [interest_pd]   NUMERIC (14, 2) NULL,
    [att_fee_pd]    NUMERIC (14, 2) NULL,
    [overage_pd]    NUMERIC (14, 2) NULL,
    [underage_pd]   NUMERIC (14, 2) NULL,
    [refund_due]    NUMERIC (14, 2) NULL,
    [pct_collected] NUMERIC (5, 2)  NULL,
    [num_owe]       INT             NULL,
    [balance]       NUMERIC (14, 2) NULL,
    [adjustments]   NUMERIC (14, 2) NULL,
    [payments]      NUMERIC (14, 2) NULL,
    [eff_tax_pd]    NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_year_to_date_recap_delq] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [recap_yr] ASC) WITH (FILLFACTOR = 100)
);


GO


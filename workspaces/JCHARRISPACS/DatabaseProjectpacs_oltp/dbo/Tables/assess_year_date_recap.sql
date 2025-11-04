CREATE TABLE [dbo].[assess_year_date_recap] (
    [year]          NUMERIC (4)     NOT NULL,
    [agency_id]     INT             NOT NULL,
    [pacs_user_id]  INT             NOT NULL,
    [orig_tax]      NUMERIC (14, 2) NULL,
    [begin_balance] NUMERIC (14, 2) NULL,
    [adjustments]   NUMERIC (14, 2) NULL,
    [adj_tax]       NUMERIC (14, 2) NULL,
    [tax_pd]        NUMERIC (14, 2) NULL,
    [underage_pd]   NUMERIC (14, 2) NULL,
    [eff_tax_pd]    NUMERIC (14, 2) NULL,
    [penalty_pd]    NUMERIC (14, 2) NULL,
    [interest_pd]   NUMERIC (14, 2) NULL,
    [bond_interest] NUMERIC (14, 2) NULL,
    [overage_pd]    NUMERIC (14, 2) NULL,
    [payments]      NUMERIC (14, 2) NULL,
    [balance]       NUMERIC (14, 2) NULL,
    [pct_collected] NUMERIC (5, 2)  NULL,
    [num_owe]       INT             NULL,
    CONSTRAINT [CPK_assess_year_date_recap] PRIMARY KEY CLUSTERED ([year] ASC, [agency_id] ASC, [pacs_user_id] ASC) WITH (FILLFACTOR = 90)
);


GO


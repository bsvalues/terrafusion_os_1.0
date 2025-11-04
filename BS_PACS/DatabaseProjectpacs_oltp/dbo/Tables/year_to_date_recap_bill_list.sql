CREATE TABLE [dbo].[year_to_date_recap_bill_list] (
    [pacs_user_id] INT             NOT NULL,
    [entity_id]    INT             NOT NULL,
    [sup_tax_yr]   NUMERIC (4)     NOT NULL,
    [bill_id]      INT             NOT NULL,
    [orig_tax]     NUMERIC (14, 2) NULL,
    [adj_tax]      NUMERIC (14, 2) NULL,
    [tax_pd]       NUMERIC (14, 2) NULL,
    [disc_pd]      NUMERIC (14, 2) NULL,
    [penalty_pd]   NUMERIC (14, 2) NULL,
    [interest_pd]  NUMERIC (14, 2) NULL,
    [att_fee_pd]   NUMERIC (14, 2) NULL,
    [overage_pd]   NUMERIC (14, 2) NULL,
    [underage_pd]  NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_year_to_date_recap_bill_list] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC, [sup_tax_yr] ASC, [bill_id] ASC) WITH (FILLFACTOR = 100)
);


GO


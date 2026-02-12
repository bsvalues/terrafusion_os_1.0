CREATE TABLE [dbo].[fiscal_month_to_date_recap_refund] (
    [pacs_user_id] INT             NOT NULL,
    [entity_id]    INT             NOT NULL,
    [refund_paid]  NUMERIC (14, 2) NULL,
    [refund_due]   NUMERIC (14, 2) NULL,
    [base_tax_pd]  NUMERIC (14, 2) NULL,
    [disc_pd]      NUMERIC (14, 2) NULL,
    [penalty_pd]   NUMERIC (14, 2) NULL,
    [interest_pd]  NUMERIC (14, 2) NULL,
    [att_fee_pd]   NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_fiscal_month_to_date_recap_refund] PRIMARY KEY CLUSTERED ([pacs_user_id] ASC, [entity_id] ASC) WITH (FILLFACTOR = 100)
);


GO


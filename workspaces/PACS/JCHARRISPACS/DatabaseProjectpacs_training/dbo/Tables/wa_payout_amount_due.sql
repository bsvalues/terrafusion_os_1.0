CREATE TABLE [dbo].[wa_payout_amount_due] (
    [run_id]         INT             NOT NULL,
    [statement_id]   INT             NOT NULL,
    [payment_date]   DATETIME        NOT NULL,
    [base_amount]    NUMERIC (14, 2) NULL,
    [bond_interest]  NUMERIC (14, 2) NULL,
    [delinquent]     NUMERIC (14, 2) NULL,
    [penalty]        NUMERIC (14, 2) NULL,
    [total_due]      NUMERIC (14, 2) NULL,
    [collection_fee] NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_wa_payout_amount_due] PRIMARY KEY CLUSTERED ([run_id] ASC, [statement_id] ASC, [payment_date] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_wa_payout_amount_due_run_id_statement_id] FOREIGN KEY ([run_id], [statement_id]) REFERENCES [dbo].[wa_payout_statement] ([run_id], [statement_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Separate collection fee amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_payout_amount_due', @level2type = N'COLUMN', @level2name = N'collection_fee';


GO


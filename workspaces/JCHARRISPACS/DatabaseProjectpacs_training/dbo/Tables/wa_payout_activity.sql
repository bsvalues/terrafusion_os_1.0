CREATE TABLE [dbo].[wa_payout_activity] (
    [run_id]              INT             NOT NULL,
    [statement_id]        INT             NOT NULL,
    [activity_id]         INT             IDENTITY (1, 1) NOT NULL,
    [activity_date]       DATETIME        NULL,
    [tax_year]            NUMERIC (4)     NULL,
    [receipt_number]      INT             NULL,
    [base_amount]         NUMERIC (14, 2) NULL,
    [bond_interest]       NUMERIC (14, 2) NULL,
    [delinquent_interest] NUMERIC (14, 2) NULL,
    [penalty]             NUMERIC (14, 2) NULL,
    [total]               NUMERIC (14, 2) NULL,
    [collection_fee]      NUMERIC (14, 2) NULL,
    CONSTRAINT [CPK_wa_payout_activity] PRIMARY KEY CLUSTERED ([run_id] ASC, [statement_id] ASC, [activity_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_wa_payout_activity_run_id_statement_id] FOREIGN KEY ([run_id], [statement_id]) REFERENCES [dbo].[wa_payout_statement] ([run_id], [statement_id])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Separate collection fee amount', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_payout_activity', @level2type = N'COLUMN', @level2name = N'collection_fee';


GO


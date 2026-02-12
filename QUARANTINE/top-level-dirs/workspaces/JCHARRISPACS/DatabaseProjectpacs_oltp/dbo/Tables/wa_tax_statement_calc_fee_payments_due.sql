CREATE TABLE [dbo].[wa_tax_statement_calc_fee_payments_due] (
    [run_year]                NUMERIC (4)     NOT NULL,
    [group_id]                INT             NOT NULL,
    [run_id]                  INT             NOT NULL,
    [fee_id]                  INT             NOT NULL,
    [payment_id]              INT             NOT NULL,
    [amt_penalty]             NUMERIC (14, 2) NOT NULL,
    [amt_interest]            NUMERIC (14, 2) NOT NULL,
    [amount_due]              NUMERIC (14, 2) NOT NULL,
    [amount_paid]             NUMERIC (14, 2) NOT NULL,
    [due_date]                DATETIME        NULL,
    [amt_bond_interest]       NUMERIC (14, 2) NOT NULL,
    [total_due_as_of_posting] NUMERIC (18, 2) NOT NULL,
    [is_h1_payment]           BIT             NULL,
    [is_delinquent]           BIT             NULL,
    CONSTRAINT [CPK_wa_tax_statement_calc_fee_payments_due] PRIMARY KEY CLUSTERED ([run_year] ASC, [group_id] ASC, [run_id] ASC, [fee_id] ASC, [payment_id] ASC) WITH (FILLFACTOR = 100)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'is_h1_payment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_calc_fee_payments_due', @level2type = N'COLUMN', @level2name = N'is_h1_payment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'is_delinquent', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'wa_tax_statement_calc_fee_payments_due', @level2type = N'COLUMN', @level2name = N'is_delinquent';


GO


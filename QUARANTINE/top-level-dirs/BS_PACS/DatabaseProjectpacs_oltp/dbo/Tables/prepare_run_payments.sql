CREATE TABLE [dbo].[prepare_run_payments] (
    [payment_run_id]            INT             NOT NULL,
    [payment_run_detail_id]     INT             NOT NULL,
    [prop_id]                   INT             NULL,
    [statement_id]              INT             NULL,
    [year]                      NUMERIC (4)     NULL,
    [payment_date]              DATETIME        NULL,
    [full_amount_due]           NUMERIC (14, 2) NULL,
    [half_amount_due]           NUMERIC (14, 2) NULL,
    [full_statement_amount_due] NUMERIC (14, 2) NULL,
    [half_statement_amount_due] NUMERIC (14, 2) NULL,
    [is_mismatch]               BIT             NULL,
    CONSTRAINT [CPK_prepare_run_payments] PRIMARY KEY CLUSTERED ([payment_run_id] ASC, [payment_run_detail_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'full_statement_amount_due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'full_statement_amount_due';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - payment_run_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'payment_run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'payment_date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'payment_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'half_statement_amount_due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'half_statement_amount_due';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - payment_run_detail_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'payment_run_detail_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'prop_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'full_amount_due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'full_amount_due';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Does the property/statement/year match bills/fees?', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'is_mismatch';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'statement_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'statement_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'half_amount_due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments', @level2type = N'COLUMN', @level2name = N'half_amount_due';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'A table to track the payment import preparation run', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payments';


GO


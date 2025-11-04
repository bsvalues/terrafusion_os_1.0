CREATE TABLE [dbo].[prepare_run_tax_due_assoc] (
    [payment_run_id] INT      NOT NULL,
    [payment_date]   DATETIME NOT NULL,
    [is_bill]        BIT      NOT NULL,
    [dataset_id]     INT      NULL,
    CONSTRAINT [CPK_prepare_run_tax_due_assoc] PRIMARY KEY CLUSTERED ([payment_run_id] ASC, [payment_date] ASC, [is_bill] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'A table to track the payment import preparation taxes due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_tax_due_assoc';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'dataset_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_tax_due_assoc', @level2type = N'COLUMN', @level2name = N'dataset_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - is_bill', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_tax_due_assoc', @level2type = N'COLUMN', @level2name = N'is_bill';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - payment_date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_tax_due_assoc', @level2type = N'COLUMN', @level2name = N'payment_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - payment_run_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_tax_due_assoc', @level2type = N'COLUMN', @level2name = N'payment_run_id';


GO


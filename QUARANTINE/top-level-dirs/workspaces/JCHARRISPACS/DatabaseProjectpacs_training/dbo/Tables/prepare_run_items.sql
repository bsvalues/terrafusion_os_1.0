CREATE TABLE [dbo].[prepare_run_items] (
    [payment_run_id]        INT             NOT NULL,
    [trans_group_id]        INT             NOT NULL,
    [is_bill]               BIT             NULL,
    [payment_date]          DATETIME        NULL,
    [full_amount_due]       NUMERIC (14, 2) NULL,
    [half_amount_due]       NUMERIC (14, 2) NULL,
    [prop_id]               INT             NULL,
    [statement_id]          INT             NULL,
    [year]                  NUMERIC (4)     NULL,
    [payment_group_id]      INT             NULL,
    [payment_run_detail_id] INT             NULL,
    CONSTRAINT [CPK_prepare_run_items] PRIMARY KEY CLUSTERED ([payment_run_id] ASC, [trans_group_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'full_amount_due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'full_amount_due';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'payment_date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'payment_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'payment_run_detail_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'payment_run_detail_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - payment_run_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'payment_run_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'statement_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'statement_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'payment_group_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'payment_group_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'is_bill', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'is_bill';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'prop_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'prop_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'A table to track the payment import preparation items', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'year', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'year';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - trans_group_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'trans_group_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'half_amount_due', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_items', @level2type = N'COLUMN', @level2name = N'half_amount_due';


GO


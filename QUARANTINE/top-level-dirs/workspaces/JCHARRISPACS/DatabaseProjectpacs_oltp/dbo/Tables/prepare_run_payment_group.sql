CREATE TABLE [dbo].[prepare_run_payment_group] (
    [payment_run_id]        INT      NOT NULL,
    [payment_run_detail_id] INT      NOT NULL,
    [payment_group_id]      INT      NOT NULL,
    [payment_date]          DATETIME NULL,
    CONSTRAINT [CPK_prepare_run_payment_group] PRIMARY KEY CLUSTERED ([payment_run_id] ASC, [payment_run_detail_id] ASC, [payment_group_id] ASC)
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'A table to track the payment import preparation payment group', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payment_group';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - payment_group_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payment_group', @level2type = N'COLUMN', @level2name = N'payment_group_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - payment_run_detail_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payment_group', @level2type = N'COLUMN', @level2name = N'payment_run_detail_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'payment_date', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payment_group', @level2type = N'COLUMN', @level2name = N'payment_date';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Property key - payment_run_id', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'prepare_run_payment_group', @level2type = N'COLUMN', @level2name = N'payment_run_id';


GO


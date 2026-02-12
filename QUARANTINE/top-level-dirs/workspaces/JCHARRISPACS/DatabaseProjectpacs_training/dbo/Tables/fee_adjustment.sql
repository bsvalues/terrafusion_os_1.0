CREATE TABLE [dbo].[fee_adjustment] (
    [fee_adj_id]                      INT             NOT NULL,
    [fee_id]                          INT             NULL,
    [transaction_id]                  INT             NULL,
    [modify_cd]                       VARCHAR (10)    NULL,
    [modify_reason]                   VARCHAR (500)   NULL,
    [sup_num]                         INT             NULL,
    [previous_bill_fee_cd]            VARCHAR (10)    NULL,
    [bill_fee_cd]                     VARCHAR (10)    NULL,
    [previous_effective_due_dt]       DATETIME        NULL,
    [effective_due_dt]                DATETIME        NULL,
    [bill_calc_type_cd]               VARCHAR (10)    NULL,
    [previous_base_amount]            NUMERIC (14, 2) NULL,
    [base_amount]                     NUMERIC (14, 2) NULL,
    [batch_id]                        INT             NULL,
    [previous_payment_status_type_cd] VARCHAR (10)    NULL,
    [payment_status_type_cd]          VARCHAR (10)    NULL,
    [adjustment_date]                 DATETIME        CONSTRAINT [CDF_fee_adjustment_adjustment_date] DEFAULT (getdate()) NULL,
    [pacs_user_id]                    INT             NULL,
    CONSTRAINT [CPK_fee_adjustment] PRIMARY KEY CLUSTERED ([fee_adj_id] ASC),
    CONSTRAINT [CFK_fee_adjustment_batch_id] FOREIGN KEY ([batch_id]) REFERENCES [dbo].[batch] ([batch_id]),
    CONSTRAINT [CFK_fee_adjustment_bill_fee_cd] FOREIGN KEY ([bill_fee_cd]) REFERENCES [dbo].[bill_fee_code] ([bill_fee_cd]),
    CONSTRAINT [CFK_fee_adjustment_fee_id] FOREIGN KEY ([fee_id]) REFERENCES [dbo].[fee] ([fee_id]),
    CONSTRAINT [CFK_fee_adjustment_previous_bill_fee_cd] FOREIGN KEY ([previous_bill_fee_cd]) REFERENCES [dbo].[bill_fee_code] ([bill_fee_cd])
);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Payment Status Type Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_adjustment', @level2type = N'COLUMN', @level2name = N'payment_status_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = ' Previous Payment Status Type Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_adjustment', @level2type = N'COLUMN', @level2name = N'previous_payment_status_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The user that generated the adjustment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_adjustment', @level2type = N'COLUMN', @level2name = N'pacs_user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The date that the adjustment occurred', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'fee_adjustment', @level2type = N'COLUMN', @level2name = N'adjustment_date';


GO


CREATE TABLE [dbo].[bill_adjustment] (
    [bill_adj_id]                     INT             NOT NULL,
    [bill_id]                         INT             NULL,
    [transaction_id]                  INT             NULL,
    [batch_id]                        INT             NULL,
    [modify_cd]                       VARCHAR (10)    NULL,
    [modify_reason]                   VARCHAR (500)   NULL,
    [annexation_adjustment]           BIT             NULL,
    [sup_num]                         INT             NULL,
    [previous_bill_fee_cd]            VARCHAR (10)    NULL,
    [bill_fee_cd]                     VARCHAR (10)    NULL,
    [previous_effective_due_dt]       DATETIME        NULL,
    [effective_due_dt]                DATETIME        NULL,
    [previous_taxable_val]            NUMERIC (14)    NULL,
    [taxable_val]                     NUMERIC (14)    NULL,
    [bill_calc_type_cd]               VARCHAR (10)    NULL,
    [previous_base_tax]               NUMERIC (14, 2) NULL,
    [base_tax]                        NUMERIC (14, 2) NULL,
    [tax_area_id]                     INT             NULL,
    [previous_payment_status_type_cd] VARCHAR (10)    NULL,
    [payment_status_type_cd]          VARCHAR (10)    NULL,
    [adjustment_date]                 DATETIME        CONSTRAINT [CDF_bill_adjustment_adjustment_date] DEFAULT (getdate()) NULL,
    [pacs_user_id]                    INT             NULL,
    CONSTRAINT [CPK_bill_adjustment] PRIMARY KEY CLUSTERED ([bill_adj_id] ASC) WITH (FILLFACTOR = 90),
    CONSTRAINT [CFK_bill_adjustment_batch_id] FOREIGN KEY ([batch_id]) REFERENCES [dbo].[batch] ([batch_id]),
    CONSTRAINT [CFK_bill_adjustment_bill_fee_cd] FOREIGN KEY ([bill_fee_cd]) REFERENCES [dbo].[bill_fee_code] ([bill_fee_cd]),
    CONSTRAINT [CFK_bill_adjustment_bill_id] FOREIGN KEY ([bill_id]) REFERENCES [dbo].[bill] ([bill_id]),
    CONSTRAINT [CFK_bill_adjustment_previous_bill_fee_cd] FOREIGN KEY ([previous_bill_fee_cd]) REFERENCES [dbo].[bill_fee_code] ([bill_fee_cd])
);


GO

CREATE NONCLUSTERED INDEX [idx_bill_id_bill_adj_id]
    ON [dbo].[bill_adjustment]([bill_id] ASC, [bill_adj_id] DESC)
    INCLUDE([modify_cd]);


GO

CREATE NONCLUSTERED INDEX [IDX_bill_adjustment_transaction_id]
    ON [dbo].[bill_adjustment]([transaction_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Previous Payment Status Type Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'bill_adjustment', @level2type = N'COLUMN', @level2name = N'previous_payment_status_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The user that generated the adjustment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'bill_adjustment', @level2type = N'COLUMN', @level2name = N'pacs_user_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Payment Status Type Code', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'bill_adjustment', @level2type = N'COLUMN', @level2name = N'payment_status_type_cd';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The date that the adjustment occurred', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'bill_adjustment', @level2type = N'COLUMN', @level2name = N'adjustment_date';


GO


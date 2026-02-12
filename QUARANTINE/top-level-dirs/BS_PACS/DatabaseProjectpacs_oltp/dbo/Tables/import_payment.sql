CREATE TABLE [dbo].[import_payment] (
    [payment_run_id]              INT             NOT NULL,
    [payment_run_detail_id]       INT             IDENTITY (1, 1) NOT NULL,
    [prop_id]                     INT             NULL,
    [geo_id]                      VARCHAR (25)    NULL,
    [primary_statement_id]        INT             NOT NULL,
    [year]                        NUMERIC (4)     NOT NULL,
    [lender_number]               VARCHAR (10)    NULL,
    [loan_id]                     VARCHAR (25)    NULL,
    [amount_paid]                 NUMERIC (14, 2) NULL,
    [amount_due]                  NUMERIC (14, 2) NULL,
    [receipt_number]              VARCHAR (20)    NULL,
    [status]                      CHAR (5)        NULL,
    [loan_activation_date]        DATETIME        NULL,
    [payment_init_date]           DATETIME        NULL,
    [settlement_date]             DATETIME        NULL,
    [payee]                       VARCHAR (30)    NULL,
    [payment_id]                  INT             NULL,
    [post_date]                   DATETIME        NULL,
    [has_pending_autopay_payment] BIT             CONSTRAINT [CDF_import_payment_has_pending_autopay_payment] DEFAULT ((0)) NOT NULL,
    [has_payout_agreement]        BIT             CONSTRAINT [CDF_import_payment_has_payout_agreement] DEFAULT ((0)) NOT NULL,
    CONSTRAINT [CPK_import_payment] PRIMARY KEY CLUSTERED ([payment_run_id] ASC, [payment_run_detail_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [CFK_import_payment_payment_run_id] FOREIGN KEY ([payment_run_id]) REFERENCES [dbo].[import_payment_run] ([payment_run_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[import_payment]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'True if the property has a pending AutoPay payment, which prevents statements on the property from being paid.', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_payment', @level2type = N'COLUMN', @level2name = N'has_pending_autopay_payment';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'flag for payout agreement', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_payment', @level2type = N'COLUMN', @level2name = N'has_payout_agreement';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'The date that should be used when posting the payment', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'import_payment', @level2type = N'COLUMN', @level2name = N'post_date';


GO


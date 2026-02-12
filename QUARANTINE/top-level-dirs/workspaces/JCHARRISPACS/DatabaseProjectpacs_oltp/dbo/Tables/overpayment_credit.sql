CREATE TABLE [dbo].[overpayment_credit] (
    [overpmt_credit_id] INT             NOT NULL,
    [prop_id]           INT             NULL,
    [source_payment_id] INT             NOT NULL,
    [amount]            NUMERIC (14, 2) NOT NULL,
    [description]       VARCHAR (50)    NULL,
    [apply_status]      VARCHAR (10)    NULL,
    [apply_payment_id]  INT             NULL,
    [acct_id]           INT             NULL,
    [ready_for_refund]  BIT             CONSTRAINT [CDF_overpayment_credit_ready_for_refund] DEFAULT ((0)) NOT NULL,
    [comment]           VARCHAR (250)   CONSTRAINT [CDF_overpayment_credit_comment] DEFAULT (' ') NULL,
    CONSTRAINT [CPK_overpayment_credit] PRIMARY KEY CLUSTERED ([overpmt_credit_id] ASC) WITH (FILLFACTOR = 100),
    CONSTRAINT [cc_overpayment_credit] CHECK ([prop_id] IS NOT NULL AND [acct_id] IS NULL OR [acct_id] IS NOT NULL AND [prop_id] IS NULL),
    CONSTRAINT [cfk_overpayment_credit_acct_id] FOREIGN KEY ([acct_id]) REFERENCES [dbo].[account] ([acct_id]),
    CONSTRAINT [CFK_overpayment_credit_overpmt_credit_id] FOREIGN KEY ([overpmt_credit_id]) REFERENCES [dbo].[trans_group] ([trans_group_id]),
    CONSTRAINT [CFK_overpayment_credit_prop_id] FOREIGN KEY ([prop_id]) REFERENCES [dbo].[property] ([prop_id])
);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[overpayment_credit]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_acct_id]
    ON [dbo].[overpayment_credit]([acct_id] ASC);


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Whether or not an Overpayment Credit is Ready for Refund', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'overpayment_credit', @level2type = N'COLUMN', @level2name = N'ready_for_refund';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'Account ID for account overpayment credits', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'overpayment_credit', @level2type = N'COLUMN', @level2name = N'acct_id';


GO

EXECUTE sp_addextendedproperty @name = N'MS_Description', @value = 'holds comment for overpaymentcredit apply', @level0type = N'SCHEMA', @level0name = N'dbo', @level1type = N'TABLE', @level1name = N'overpayment_credit', @level2type = N'COLUMN', @level2name = N'comment';


GO


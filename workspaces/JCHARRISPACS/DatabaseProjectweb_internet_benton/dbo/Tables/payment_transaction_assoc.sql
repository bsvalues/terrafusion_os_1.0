CREATE TABLE [dbo].[payment_transaction_assoc] (
    [payment_id]            INT             NOT NULL,
    [transaction_id]        INT             NOT NULL,
    [voided]                BIT             NULL,
    [void_transaction_id]   INT             NULL,
    [year]                  NUMERIC (4)     NULL,
    [sup_num]               INT             NULL,
    [prop_id]               INT             NULL,
    [receipt_owner_id]      INT             NULL,
    [receipt_legal_acreage] NUMERIC (14, 4) NULL,
    [receipt_legal_desc]    VARCHAR (255)   NULL,
    [payment_due_id]        INT             NULL,
    [payment_due_date]      DATETIME        NULL,
    [treasurer_rcpt_number] INT             NULL,
    [item_paid_owner_id]    INT             NULL,
    CONSTRAINT [CPK_payment_transaction_assoc] PRIMARY KEY CLUSTERED ([payment_id] ASC, [transaction_id] ASC)
);


GO

CREATE NONCLUSTERED INDEX [idx_transaction_id]
    ON [dbo].[payment_transaction_assoc]([transaction_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_prop_id]
    ON [dbo].[payment_transaction_assoc]([prop_id] ASC) WITH (FILLFACTOR = 90);


GO

CREATE NONCLUSTERED INDEX [idx_void_transaction_id]
    ON [dbo].[payment_transaction_assoc]([void_transaction_id] ASC) WITH (FILLFACTOR = 90);


GO


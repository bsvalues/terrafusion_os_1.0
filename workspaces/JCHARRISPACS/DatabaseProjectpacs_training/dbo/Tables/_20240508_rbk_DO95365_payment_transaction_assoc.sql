CREATE TABLE [dbo].[_20240508_rbk_DO95365_payment_transaction_assoc] (
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
    [item_paid_owner_id]    INT             NULL
);


GO


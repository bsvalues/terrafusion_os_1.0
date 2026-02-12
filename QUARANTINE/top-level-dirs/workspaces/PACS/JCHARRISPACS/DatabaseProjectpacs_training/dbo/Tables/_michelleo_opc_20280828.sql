CREATE TABLE [dbo].[_michelleo_opc_20280828] (
    [overpmt_credit_id] INT             NOT NULL,
    [prop_id]           INT             NULL,
    [source_payment_id] INT             NOT NULL,
    [amount]            NUMERIC (14, 2) NOT NULL,
    [description]       VARCHAR (50)    NULL,
    [apply_status]      VARCHAR (10)    NULL,
    [apply_payment_id]  INT             NULL,
    [acct_id]           INT             NULL,
    [ready_for_refund]  BIT             NOT NULL,
    [comment]           VARCHAR (250)   NULL
);


GO


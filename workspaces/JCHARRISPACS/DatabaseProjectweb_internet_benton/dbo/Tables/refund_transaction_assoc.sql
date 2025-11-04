CREATE TABLE [dbo].[refund_transaction_assoc] (
    [refund_id]                INT             NOT NULL,
    [transaction_id]           INT             NOT NULL,
    [refund_type_cd]           VARCHAR (20)    NOT NULL,
    [year]                     NUMERIC (4)     NOT NULL,
    [sup_num]                  INT             NULL,
    [prop_id]                  INT             NULL,
    [voided]                   BIT             NULL,
    [void_transaction_id]      INT             NULL,
    [reference_id]             INT             NULL,
    [account_id]               INT             NULL,
    [override_refund_interest] BIT             NOT NULL,
    [refund_interest]          NUMERIC (14, 2) NOT NULL,
    [refund_type_year]         NUMERIC (4)     NOT NULL
);


GO


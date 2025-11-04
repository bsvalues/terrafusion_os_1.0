CREATE TABLE [dbo].[import_payment_file] (
    [prop_id]              INT             NULL,
    [geo_id]               VARCHAR (25)    NULL,
    [primary_statement_id] INT             NULL,
    [year]                 NUMERIC (4)     NULL,
    [lender_number]        VARCHAR (10)    NULL,
    [loan_id]              VARCHAR (25)    NULL,
    [loan_activation_date] VARCHAR (8)     NULL,
    [amount_paid]          NUMERIC (14, 2) NULL,
    [payment_code]         VARCHAR (1)     NULL,
    [type]                 VARCHAR (1)     NULL,
    [receipt_number]       VARCHAR (20)    NULL,
    [payment_init_date]    VARCHAR (8)     NULL,
    [settlement_date]      VARCHAR (8)     NULL,
    [payee]                VARCHAR (30)    NULL
);


GO


CREATE TABLE [dbo].[import_payment_statements] (
    [payment_run_id]        INT         NOT NULL,
    [payment_run_detail_id] INT         NOT NULL,
    [statement_id]          INT         NOT NULL,
    [year]                  NUMERIC (4) NOT NULL,
    [prop_id]               INT         NOT NULL,
    [pay_code]              CHAR (1)    NOT NULL,
    CONSTRAINT [CPK_import_payment_statements] PRIMARY KEY CLUSTERED ([payment_run_id] ASC, [payment_run_detail_id] ASC, [statement_id] ASC, [year] ASC, [prop_id] ASC),
    CONSTRAINT [CFK_import_payment_statements_payment_run_id] FOREIGN KEY ([payment_run_id]) REFERENCES [dbo].[import_payment_run] ([payment_run_id])
);


GO


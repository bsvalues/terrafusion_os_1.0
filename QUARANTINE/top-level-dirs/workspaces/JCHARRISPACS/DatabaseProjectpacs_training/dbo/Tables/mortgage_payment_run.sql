CREATE TABLE [dbo].[mortgage_payment_run] (
    [mortgage_run_id] INT             NOT NULL,
    [payee_id]        INT             NULL,
    [check_amt]       NUMERIC (14, 2) NULL,
    [check_num]       INT             NULL,
    [pacs_user_id]    INT             NULL,
    [status]          CHAR (5)        NULL,
    [updated_date]    DATETIME        NULL,
    [paid_date]       DATETIME        NULL,
    CONSTRAINT [CPK_mortgage_payment_run] PRIMARY KEY CLUSTERED ([mortgage_run_id] ASC) WITH (FILLFACTOR = 100)
);


GO


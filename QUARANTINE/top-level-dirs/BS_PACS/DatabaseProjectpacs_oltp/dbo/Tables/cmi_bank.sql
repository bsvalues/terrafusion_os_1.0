CREATE TABLE [dbo].[cmi_bank] (
    [code]             VARCHAR (10) NOT NULL,
    [description]      VARCHAR (50) NULL,
    [bank_number]      VARCHAR (9)  NULL,
    [account_id]       NUMERIC (10) NULL,
    [account_number]   VARCHAR (30) NULL,
    [fund]             VARCHAR (4)  NULL,
    [status]           VARCHAR (10) NULL,
    [transaction_type] VARCHAR (7)  NULL,
    CONSTRAINT [CPK_cmi_bank] PRIMARY KEY CLUSTERED ([code] ASC) WITH (FILLFACTOR = 100)
);


GO


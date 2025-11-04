CREATE TABLE [dbo].[batch_chart_of_accounts] (
    [acct]             INT           IDENTITY (1, 1) NOT NULL,
    [acct_num]         VARCHAR (50)  NULL,
    [acct_description] VARCHAR (100) NULL,
    [acct_id]          INT           NULL,
    [bank_acct]        VARCHAR (20)  NULL,
    [comment]          VARCHAR (200) NULL,
    [check_line1]      VARCHAR (50)  NULL,
    [check_line2]      VARCHAR (50)  NULL,
    [check_line3]      VARCHAR (50)  NULL,
    [check_line4]      VARCHAR (50)  NULL,
    [ach_deposit]      CHAR (1)      NULL,
    CONSTRAINT [CPK_batch_chart_of_accounts] PRIMARY KEY CLUSTERED ([acct] ASC) WITH (FILLFACTOR = 100)
);


GO


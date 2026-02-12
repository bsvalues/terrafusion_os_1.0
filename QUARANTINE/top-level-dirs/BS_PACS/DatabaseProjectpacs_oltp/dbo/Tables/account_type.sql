CREATE TABLE [dbo].[account_type] (
    [acct_type_cd]   VARCHAR (5)  NOT NULL,
    [acct_type_desc] VARCHAR (50) NULL,
    CONSTRAINT [CPK_account_type] PRIMARY KEY CLUSTERED ([acct_type_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


CREATE TABLE [dbo].[misc_expense_code] (
    [misc_expense_cd]   VARCHAR (10) NOT NULL,
    [misc_expense_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_misc_expense_code] PRIMARY KEY CLUSTERED ([misc_expense_cd] ASC)
);


GO


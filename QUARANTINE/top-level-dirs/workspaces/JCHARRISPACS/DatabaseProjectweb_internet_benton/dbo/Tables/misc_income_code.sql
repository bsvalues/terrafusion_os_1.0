CREATE TABLE [dbo].[misc_income_code] (
    [misc_income_cd]   VARCHAR (10) NOT NULL,
    [misc_income_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_misc_income_code] PRIMARY KEY CLUSTERED ([misc_income_cd] ASC)
);


GO


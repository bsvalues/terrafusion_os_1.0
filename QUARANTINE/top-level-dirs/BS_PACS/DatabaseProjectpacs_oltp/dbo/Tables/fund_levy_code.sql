CREATE TABLE [dbo].[fund_levy_code] (
    [fund_levy_cd]   VARCHAR (10) NOT NULL,
    [fund_levy_desc] VARCHAR (50) NOT NULL,
    [sys_flag]       BIT          NULL,
    CONSTRAINT [CPK_fund_levy_code] PRIMARY KEY CLUSTERED ([fund_levy_cd] ASC)
);


GO


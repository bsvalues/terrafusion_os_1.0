CREATE TABLE [dbo].[fund_number] (
    [fund_number]         NUMERIC (14) NOT NULL,
    [description]         VARCHAR (50) NULL,
    [tax_district_id]     INT          NULL,
    [levy_cd]             VARCHAR (10) NOT NULL,
    [display_fund_number] AS           (right('0000000000'+CONVERT([varchar],[fund_number],(0)),(10))),
    CONSTRAINT [CPK_fund_number] PRIMARY KEY CLUSTERED ([fund_number] ASC, [levy_cd] ASC)
);


GO


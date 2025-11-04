CREATE TABLE [dbo].[mobile_county] (
    [county_cd]   VARCHAR (2) NOT NULL,
    [county_desc] VARCHAR (2) NOT NULL,
    CONSTRAINT [CPK_mobile_county] PRIMARY KEY CLUSTERED ([county_cd] ASC)
);


GO


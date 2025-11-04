CREATE TABLE [dbo].[county_ratio_code] (
    [ratio_cd]   VARCHAR (10) NOT NULL,
    [ratio_desc] VARCHAR (30) NOT NULL,
    CONSTRAINT [CPK_county_ratio_code] PRIMARY KEY CLUSTERED ([ratio_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


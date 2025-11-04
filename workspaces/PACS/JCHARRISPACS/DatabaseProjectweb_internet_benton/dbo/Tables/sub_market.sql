CREATE TABLE [dbo].[sub_market] (
    [sub_market_cd]   VARCHAR (10) NOT NULL,
    [sub_market_desc] VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_sub_market] PRIMARY KEY CLUSTERED ([sub_market_cd] ASC) WITH (FILLFACTOR = 90)
);


GO


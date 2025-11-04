CREATE TABLE [dbo].[urban_growth_code] (
    [urban_growth_cd]   VARCHAR (10) NOT NULL,
    [urban_growth_desc] VARCHAR (50) NOT NULL,
    [sys_flag]          BIT          NULL,
    CONSTRAINT [CPK_urban_growth_code] PRIMARY KEY CLUSTERED ([urban_growth_cd] ASC) WITH (FILLFACTOR = 100)
);


GO


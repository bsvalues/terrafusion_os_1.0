CREATE TABLE [dbo].[land_soil] (
    [szLandSoilCode] CHAR (10)    NOT NULL,
    [szLandSoilDesc] VARCHAR (64) NULL,
    CONSTRAINT [CPK_land_soil] PRIMARY KEY CLUSTERED ([szLandSoilCode] ASC) WITH (FILLFACTOR = 100)
);


GO


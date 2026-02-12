CREATE TABLE [dbo].[land_influence] (
    [szLandInfluenceCode] VARCHAR (10) NOT NULL,
    [szLandInfluenceDesc] VARCHAR (64) NOT NULL,
    [rc_type]             CHAR (1)     NULL,
    CONSTRAINT [CPK_land_influence] PRIMARY KEY CLUSTERED ([szLandInfluenceCode] ASC) WITH (FILLFACTOR = 100)
);


GO


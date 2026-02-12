CREATE TABLE [dbo].[land_class] (
    [szLandClassCode] CHAR (3)     NOT NULL,
    [szLandClassDesc] VARCHAR (64) NOT NULL,
    [rc_type]         CHAR (1)     NULL,
    CONSTRAINT [CPK_land_class] PRIMARY KEY CLUSTERED ([szLandClassCode] ASC) WITH (FILLFACTOR = 100)
);


GO


CREATE TABLE [dbo].[gis_image] (
    [location] VARCHAR (255) NOT NULL,
    CONSTRAINT [CPK_gis_image] PRIMARY KEY CLUSTERED ([location] ASC) WITH (FILLFACTOR = 100)
);


GO


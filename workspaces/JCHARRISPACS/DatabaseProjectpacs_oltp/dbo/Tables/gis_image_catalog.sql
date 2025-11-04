CREATE TABLE [dbo].[gis_image_catalog] (
    [catalog_id] INT          IDENTITY (1, 1) NOT NULL,
    [name]       VARCHAR (32) NOT NULL,
    [view_name]  VARCHAR (50) NOT NULL,
    CONSTRAINT [CPK_gis_image_catalog] PRIMARY KEY CLUSTERED ([catalog_id] ASC) WITH (FILLFACTOR = 90)
);


GO


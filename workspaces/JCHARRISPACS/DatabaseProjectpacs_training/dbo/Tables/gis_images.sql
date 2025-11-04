CREATE TABLE [dbo].[gis_images] (
    [image_id]   INT            IDENTITY (1, 1) NOT NULL,
    [catalog_id] INT            NOT NULL,
    [name]       VARCHAR (50)   NULL,
    [image]      VARCHAR (1024) NOT NULL,
    [xmin]       FLOAT (53)     NOT NULL,
    [ymin]       FLOAT (53)     NOT NULL,
    [xmax]       FLOAT (53)     NOT NULL,
    [ymax]       FLOAT (53)     NOT NULL,
    CONSTRAINT [CPK_gis_images] PRIMARY KEY CLUSTERED ([image_id] ASC) WITH (FILLFACTOR = 100)
);


GO


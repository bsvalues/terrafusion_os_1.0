

CREATE VIEW dbo.gis_image_vw
AS
SELECT     dbo.gis_image_catalog.name, dbo.gis_image_catalog.catalog_id, dbo.gis_images.image_id, dbo.gis_images.image, dbo.gis_images.xmin, 
                      dbo.gis_images.ymin, dbo.gis_images.xmax, dbo.gis_images.ymax
FROM         dbo.gis_image_catalog INNER JOIN
                      dbo.gis_images ON dbo.gis_image_catalog.catalog_id = dbo.gis_images.catalog_id
Where        dbo.gis_image_catalog.catalog_id = 15

GO


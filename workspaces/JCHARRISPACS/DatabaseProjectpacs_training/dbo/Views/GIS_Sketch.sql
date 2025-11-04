create view GIS_Sketch as 
SELECT  [id]
      ,[prop_id]
      ,[prop_val_yr]
      ,[imprv_id]
      ,[image_path]
  FROM [web_internet_benton].[dbo].[_clientdb_property_sketch]
  Where prop_val_yr=(select appr_yr from pacs_oltp.dbo.pacs_system)

GO

